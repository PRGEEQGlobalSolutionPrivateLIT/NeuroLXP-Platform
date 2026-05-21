import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LxpMemberRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { OtpStoreService } from '@/superadmin/otp/otp-store.service';
import { MemberAuthService } from './member-auth.service';
import { v4 as uuidv4 } from 'uuid';

type SigninDraft = {
  forgotNewPasswordHash?: string;
  forgotOtpVerified?: boolean;
  totpFailed?: boolean;
  recoveryFailed?: boolean;
  pendingRecoveryCode?: string;
};

@Injectable()
export class MemberSigninService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private otpStore: OtpStoreService,
    private memberAuth: MemberAuthService,
  ) {}

  getApproverRole(memberRole: LxpMemberRole): 'coordinator' | 'institution_admin' {
    if (memberRole === 'coordinator') return 'institution_admin';
    return 'coordinator';
  }

  private detectIdentifierType(value: string): 'email' | 'user_id' | 'phone' {
    if (value.includes('@')) return 'email';
    if (value.toUpperCase().startsWith('PRGEEQ')) return 'user_id';
    return 'phone';
  }

  private async findMemberByIdentifier(identifier: string, role: LxpMemberRole) {
    const trimmed = identifier.trim();
    if (!trimmed) return null;

    const type = this.detectIdentifierType(trimmed);
    if (type === 'email') {
      return this.prisma.lxpMember.findUnique({
        where: { email_role: { email: trimmed.toLowerCase(), role } },
      });
    }
    if (type === 'user_id') {
      return this.prisma.lxpMember.findFirst({
        where: { user_id: trimmed.toUpperCase(), role },
      });
    }
    const phone = trimmed.replace(/\s+/g, '');
    return this.prisma.lxpMember.findFirst({
      where: { role, phone },
    });
  }

  async primarySignin(identifier: string, password: string, role: LxpMemberRole) {
    const member = await this.findMemberByIdentifier(identifier, role);
    if (!member) throw new UnauthorizedException('Invalid credentials');

    const match = await this.passwordService.verifyPassword(password, member.password_hash);

    if (!match) {
      const sessionId = await this.createSigninSession(member.id, false);
      return {
        passwordMatched: false,
        sessionId,
        role: member.role,
        email: member.email,
        message: 'Invalid password. Try a fallback method below.',
      };
    }

    if (!member.onboarding_completed || member.must_change_password) {
      const sessionId = await this.createSigninSession(member.id, true);
      return {
        passwordMatched: true,
        sessionId,
        memberId: member.id,
        requiresOnboarding: true,
        role: member.role,
        email: member.email,
        fullName: member.full_name,
      };
    }

    const sessionId = await this.createSigninSession(member.id, true);
    const result = await this.memberAuth.completeSigninFromSession(sessionId, member.id);
    return { passwordMatched: true, ...result };
  }

  async verifyTotpSignin(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    if (!member.totp_secret) throw new BadRequestException('Authenticator not configured');
    if (!this.otpService.verifyTotp(member.totp_secret, code)) {
      const draft = this.getDraft(session);
      await this.prisma.lxpMemberSigninSession.update({
        where: { session_id: sessionId },
        data: { draft_data: { ...draft, totpFailed: true } as object },
      });
      const updated = await this.getSigninSession(sessionId);
      return {
        matched: false,
        openApproval: this.shouldOpenApproval(this.getDraft(updated)),
      };
    }
    return this.memberAuth.completeSigninFromSession(sessionId, member.id);
  }

  async verifyRecoverySignin(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    if (!member.recovery_code_hash) {
      return { matched: false, openApproval: true };
    }

    const valid = await this.passwordService.verifyPassword(code.trim(), member.recovery_code_hash);
    if (!valid) {
      const draft = this.getDraft(session);
      await this.prisma.lxpMemberSigninSession.update({
        where: { session_id: sessionId },
        data: { draft_data: { ...draft, recoveryFailed: true } as object },
      });
      const updated = await this.getSigninSession(sessionId);
      return {
        matched: false,
        openApproval: this.shouldOpenApproval(this.getDraft(updated)),
      };
    }

    const newCode = this.otpService.generateRecoveryCode();
    const newHash = await this.passwordService.hashPassword(newCode);
    await this.prisma.lxpMember.update({
      where: { id: member.id },
      data: { recovery_code_hash: newHash },
    });

    const draft = this.getDraft(session);
    await this.prisma.lxpMemberSigninSession.update({
      where: { session_id: sessionId },
      data: { draft_data: { ...draft, pendingRecoveryCode: newCode } as object },
    });

    const login = await this.memberAuth.completeSigninFromSession(sessionId, member.id);
    return { matched: true, newRecoveryCode: newCode, ...login };
  }

  private shouldOpenApproval(draft: SigninDraft) {
    return Boolean(draft.totpFailed && draft.recoveryFailed);
  }

  async startForgotPassword(identifier: string, role: LxpMemberRole) {
    const member = await this.findMemberByIdentifier(identifier, role);
    if (!member) throw new BadRequestException('Account not found');

    const sessionId = uuidv4();
    await this.prisma.lxpMemberSigninSession.create({
      data: {
        session_id: sessionId,
        member_id: member.id,
        password_verified: false,
        draft_data: { flow: 'forgot_password' },
        expires_at: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return { sessionId, maskedEmail: this.maskEmail(member.email) };
  }

  async setForgotPassword(sessionId: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) throw new BadRequestException('Passwords do not match');
    const session = await this.getSigninSession(sessionId);
    this.assertForgotFlow(session);
    const hash = await this.passwordService.hashPassword(newPassword);
    const draft = this.getDraft(session);
    await this.prisma.lxpMemberSigninSession.update({
      where: { session_id: sessionId },
      data: { draft_data: { ...draft, forgotNewPasswordHash: hash } as object },
    });
    return { success: true };
  }

  async sendForgotOtp(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    this.assertForgotFlow(session);
    const member = await this.getMember(session.member_id);
    const draft = this.getDraft(session);
    if (!draft.forgotNewPasswordHash) {
      throw new BadRequestException('Set new password first');
    }
    const result = await this.otpStore.sendOtp(member.email, 'email');
    return { ...result, maskedEmail: this.maskEmail(member.email) };
  }

  async verifyForgotOtp(sessionId: string, otp: string) {
    const session = await this.getSigninSession(sessionId);
    this.assertForgotFlow(session);
    const member = await this.getMember(session.member_id);
    const draft = this.getDraft(session);
    if (!draft.forgotNewPasswordHash) throw new BadRequestException('Set new password first');

    let valid = false;
    try {
      valid = await this.otpStore.verifyOtp(member.email, 'email', otp);
    } catch {
      valid = false;
    }
    if (!valid) throw new BadRequestException('Invalid OTP');

    await this.prisma.lxpMember.update({
      where: { id: member.id },
      data: { password_hash: draft.forgotNewPasswordHash! },
    });
    await this.prisma.lxpMemberSigninSession.deleteMany({ where: { session_id: sessionId } });

    return { success: true, message: 'Password reset completed' };
  }

  async requestUpperLevelApproval(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    const approverRole = this.getApproverRole(member.role);

    const existing = await this.prisma.lxpMemberApprovalRequest.findFirst({
      where: { member_id: member.id, status: 'pending', approver_role: approverRole },
    });
    if (existing) {
      return {
        requestId: existing.id,
        approverRole,
        message: `Waiting for ${approverRole === 'coordinator' ? 'Coordinator' : 'Institution Admin'} approval`,
      };
    }

    const req = await this.prisma.lxpMemberApprovalRequest.create({
      data: {
        member_id: member.id,
        session_id: sessionId,
        approver_role: approverRole,
        status: 'pending',
      },
    });

    const label = approverRole === 'coordinator' ? 'Coordinator' : 'Institution Admin';
    return {
      requestId: req.id,
      approverRole,
      message: `Approval requested. A ${label} must approve your sign-in.`,
    };
  }

  async checkUpperLevelApproval(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const member = await this.getMember(session.member_id);
    const approverRole = this.getApproverRole(member.role);

    const approved = await this.prisma.lxpMemberApprovalRequest.findFirst({
      where: { member_id: member.id, approver_role: approverRole, status: 'approved' },
      orderBy: { updated_at: 'desc' },
    });

    if (!approved) {
      return { approved: false, message: 'Still waiting for approval' };
    }

    return this.memberAuth.completeSigninFromSession(sessionId, member.id);
  }

  async listPendingApprovals(approverRole: 'coordinator' | 'institution_admin') {
    const roleFilter =
      approverRole === 'coordinator'
        ? { in: ['student', 'faculty'] as LxpMemberRole[] }
        : { equals: 'coordinator' as LxpMemberRole };

    return this.prisma.lxpMemberApprovalRequest.findMany({
      where: { status: 'pending', approver_role: approverRole, member: { role: roleFilter } },
      include: {
        member: { select: { full_name: true, email: true, role: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async approveMemberRequest(requestId: string) {
    const req = await this.prisma.lxpMemberApprovalRequest.findUnique({ where: { id: requestId } });
    if (!req || req.status !== 'pending') throw new BadRequestException('Request not found');

    await this.prisma.lxpMemberApprovalRequest.update({
      where: { id: requestId },
      data: { status: 'approved' },
    });

    return { approved: true, memberId: req.member_id };
  }

  private async createSigninSession(memberId: string, passwordVerified: boolean) {
    const sessionId = uuidv4();
    await this.prisma.lxpMemberSigninSession.create({
      data: {
        session_id: sessionId,
        member_id: memberId,
        password_verified: passwordVerified,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    return sessionId;
  }

  private assertForgotFlow(session: { draft_data: unknown }) {
    const draft = session.draft_data as { flow?: string };
    if (draft?.flow !== 'forgot_password') throw new BadRequestException('Invalid forgot-password session');
  }

  private getDraft(session: { draft_data: unknown }): SigninDraft & { flow?: string } {
    return (session.draft_data as SigninDraft & { flow?: string }) || {};
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

  private maskEmail(email: string) {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}****@${domain}`;
  }
}
