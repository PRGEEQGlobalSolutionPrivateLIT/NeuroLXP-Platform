import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LxpMemberRole, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  asExtraRecord,
  buildCsvProfileData,
  normalizeStudentSupplement,
  type StudentSupplement,
} from './member-profile.util';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MemberAuthService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private jwtService: JwtService,
  ) {}

  async consumeMagicLink(token: string, email: string, role: LxpMemberRole) {
    const member = await this.prisma.lxpMember.findUnique({
      where: { email_role: { email: email.trim().toLowerCase(), role } },
    });
    if (!member?.magic_link_token_hash || !member.magic_link_expires_at) {
      throw new BadRequestException('Invalid magic link');
    }
    if (new Date() > member.magic_link_expires_at) {
      throw new BadRequestException('Magic link expired');
    }
    const valid = await this.passwordService.verifyPassword(token, member.magic_link_token_hash);
    if (!valid) throw new BadRequestException('Invalid magic link');

    await this.prisma.lxpMember.update({
      where: { id: member.id },
      data: { magic_link_token_hash: null, magic_link_expires_at: null },
    });

    if (!member.onboarding_completed || member.must_change_password) {
      const sessionId = await this.createOnboardingSession(member.id);
      return {
        sessionId,
        memberId: member.id,
        requiresOnboarding: true,
        role: member.role,
        email: member.email,
        fullName: member.full_name,
      };
    }

    const sessionId = await this.createOnboardingSession(member.id);
    return {
      sessionId,
      memberId: member.id,
      requiresOnboarding: false,
      requiresTotp: !!member.totp_secret,
      role: member.role,
      email: member.email,
      fullName: member.full_name,
    };
  }

  /** @deprecated use MemberSigninService.primarySignin */
  async signIn(email: string, password: string, role: LxpMemberRole) {
    const member = await this.prisma.lxpMember.findUnique({
      where: { email_role: { email: email.trim().toLowerCase(), role } },
    });
    if (!member) throw new UnauthorizedException('Invalid credentials');
    const match = await this.passwordService.verifyPassword(password, member.password_hash);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return this.completeSigninFromSession(await this.createOnboardingSession(member.id), member.id);
  }

  async setOnboardingPassword(sessionId: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) throw new BadRequestException('Passwords do not match');
    const session = await this.getSigninSession(sessionId);
    const hash = await this.passwordService.hashPassword(newPassword);
    await this.prisma.lxpMember.update({
      where: { id: session.member_id },
      data: { password_hash: hash, must_change_password: false },
    });
    return { success: true };
  }

  async totpSetup(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    const { secret, qrCodeUrl } = this.otpService.generateTotpSecret(member.email, member.role);
    const qrCodeDataUrl = await this.otpService.generateQrCodeDataUrl(qrCodeUrl);
    await this.prisma.lxpMember.update({
      where: { id: member.id },
      data: { totp_secret: secret },
    });
    return { qrCodeDataUrl, secret };
  }

  async totpVerifyOnboarding(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    if (!member.totp_secret || !this.otpService.verifyTotp(member.totp_secret, code)) {
      throw new BadRequestException('Invalid authenticator code');
    }
    return { verified: true };
  }

  async completeOnboarding(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    if (!member.totp_secret) {
      throw new BadRequestException('Complete authenticator setup first');
    }

    const recoveryCode = this.otpService.generateRecoveryCode();
    const recoveryHash = await this.passwordService.hashPassword(recoveryCode);
    const userId = member.user_id ?? this.otpService.generateUserId(member.full_name);

    await this.prisma.lxpMember.update({
      where: { id: member.id },
      data: {
        onboarding_completed: true,
        must_change_password: false,
        recovery_code_hash: recoveryHash,
        user_id: userId,
      },
    });

    return this.completeSigninFromSession(sessionId, member.id, recoveryCode, userId);
  }

  async completeSigninFromSession(
    sessionId: string,
    memberId: string,
    pendingRecoveryCode?: string,
    assignedUserId?: string,
  ) {
    const session = await this.getSigninSession(sessionId);
    const draft = (session.draft_data as { pendingRecoveryCode?: string }) || {};
    const member = await this.getMember(memberId);
    const tokens = await this.createSession(memberId);
    await this.prisma.lxpMemberSigninSession.deleteMany({ where: { session_id: sessionId } });

    const newRecoveryCode = pendingRecoveryCode ?? draft.pendingRecoveryCode;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      memberId: member.id,
      role: member.role,
      email: member.email,
      fullName: member.full_name,
      userId: assignedUserId ?? member.user_id ?? undefined,
      mustChangePassword: false,
      onboardingCompleted: true,
      ...(newRecoveryCode && { newRecoveryCode }),
    };
  }

  async changePassword(memberId: string, newPassword: string) {
    const member = await this.getMember(memberId);
    const hash = await this.passwordService.hashPassword(newPassword);
    await this.prisma.lxpMember.update({
      where: { id: memberId },
      data: { password_hash: hash, must_change_password: false },
    });
    return { success: true, mustChangePassword: false };
  }

  async getProfile(memberId: string) {
    const member = await this.getMember(memberId);
    const extra = asExtraRecord(member.extra_data);
    let tenantId = extra.tenant_id ? String(extra.tenant_id) : null;
    let tenantName = extra.tenant_name ? String(extra.tenant_name) : null;

    if (member.role === 'student' && !tenantId) {
      const bulkCred = await this.prisma.memberBulkUploadCredential.findFirst({
        where: { member_id: member.id },
        orderBy: { created_at: 'desc' },
        include: { bulk_upload: true },
      });
      if (bulkCred?.bulk_upload?.tenant_id) {
        tenantId = bulkCred.bulk_upload.tenant_id;
        tenantName = bulkCred.bulk_upload.tenant_name ?? tenantName;
      }
    }

    const base = {
      id: member.id,
      role: member.role,
      fullName: member.full_name,
      email: member.email,
      phone: member.phone,
      department: member.department,
      employeeId: member.employee_id,
      extraData: member.extra_data,
      mustChangePassword: member.must_change_password,
      onboardingCompleted: member.onboarding_completed,
      hasTotp: !!member.totp_secret,
      userId: member.user_id,
      tenantId,
      tenantName,
    };

    if (member.role !== 'student') {
      return base;
    }

    return {
      ...base,
      csvProfile: buildCsvProfileData(member),
      studentSupplement: normalizeStudentSupplement(extra.student_supplement),
    };
  }

  async updateProfile(
    memberId: string,
    dto: {
      fullName?: string;
      phone?: string;
      department?: string;
      employeeId?: string;
      studentSupplement?: Partial<StudentSupplement>;
    },
  ) {
    const member = await this.getMember(memberId);

    if (member.role === 'student') {
      if (dto.studentSupplement === undefined) {
        throw new BadRequestException('No profile updates provided');
      }
      const extra = asExtraRecord(member.extra_data);
      const merged = normalizeStudentSupplement({
        ...normalizeStudentSupplement(extra.student_supplement),
        ...dto.studentSupplement,
      });
      await this.prisma.lxpMember.update({
        where: { id: memberId },
        data: {
          extra_data: {
            ...extra,
            student_supplement: merged,
          } as Prisma.InputJsonValue,
        },
      });
      return this.getProfile(memberId);
    }

    await this.prisma.lxpMember.update({
      where: { id: memberId },
      data: {
        ...(dto.fullName && { full_name: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.replace(/\s+/g, '') || null }),
        ...(dto.department !== undefined && { department: dto.department || null }),
        ...(dto.employeeId !== undefined && { employee_id: dto.employeeId || null }),
      },
    });
    return this.getProfile(memberId);
  }

  private async createOnboardingSession(memberId: string) {
    const sessionId = uuidv4();
    await this.prisma.lxpMemberSigninSession.create({
      data: {
        session_id: sessionId,
        member_id: memberId,
        password_verified: true,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return sessionId;
  }

  async getSigninSession(sessionId: string) {
    const session = await this.prisma.lxpMemberSigninSession.findUnique({
      where: { session_id: sessionId },
    });
    if (!session || new Date() > session.expires_at) {
      throw new BadRequestException('Invalid or expired session');
    }
    return session;
  }

  private async getMember(id: string) {
    const member = await this.prisma.lxpMember.findUnique({ where: { id } });
    if (!member) throw new BadRequestException('Member not found');
    return member;
  }

  private async createSession(memberId: string) {
    const refreshToken = this.jwtService.sign(
      { sub: memberId, type: 'member_refresh' },
      { expiresIn: '7d' },
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.lxpMemberSession.create({
      data: { member_id: memberId, refresh_token: refreshToken, expires_at: expiresAt },
    });

    const accessToken = this.jwtService.sign(
      { sub: memberId, type: 'member_access' },
      { expiresIn: '15m' },
    );

    return { accessToken, refreshToken };
  }
}
