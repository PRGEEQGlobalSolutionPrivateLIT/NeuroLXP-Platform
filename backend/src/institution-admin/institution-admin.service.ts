import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { OtpStoreService } from '@/superadmin/otp/otp-store.service';
import { OtpDeliveryService } from '@/superadmin/otp/otp-delivery.service';
import { InstitutionAdminAuthService } from './institution-admin-auth.service';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

@Injectable()
export class InstitutionAdminService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private otpStore: OtpStoreService,
    private delivery: OtpDeliveryService,
    private auth: InstitutionAdminAuthService,
  ) {}

  async invite(dto: {
    fullName: string;
    dateOfBirth: string;
    primaryEmail: string;
    primaryPhone: string;
    password: string;
    createdByPlatformAdminId?: string;
  }) {
    const email = dto.primaryEmail.trim().toLowerCase();
    const phone = dto.primaryPhone.replace(/\s+/g, '');

    const exists = await this.prisma.institutionAdmin.findFirst({
      where: { OR: [{ primary_email: email }, { primary_phone: phone }] },
    });
    if (exists) throw new BadRequestException('Email or phone already registered');

    const recoveryCode = this.otpService.generateRecoveryCode();
    const recoveryHash = await this.passwordService.hashPassword(recoveryCode);
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const magicToken = randomBytes(32).toString('hex');
    const magicHash = await this.passwordService.hashPassword(magicToken);

    const admin = await this.prisma.institutionAdmin.create({
      data: {
        full_name: dto.fullName.trim(),
        date_of_birth: new Date(dto.dateOfBirth),
        primary_email: email,
        primary_phone: phone,
        password_hash: passwordHash,
        recovery_code_hash: recoveryHash,
        magic_link_token_hash: magicHash,
        magic_link_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_by_platform_admin: dto.createdByPlatformAdminId,
        onboarding_completed: false,
      },
    });

    const magicLink = `${FRONTEND_URL}/institution-admin/auth/magic?token=${magicToken}&email=${encodeURIComponent(email)}`;
    await this.sendMagicLinkEmail(email, magicLink);

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      institutionAdminId: admin.id,
      recoveryCode,
      magicLinkSent: true,
      ...(isDev && { devMagicLink: magicLink }),
      message: 'Institution admin invited. Recovery code shown once — save it. Magic link sent to primary email.',
    };
  }

  private async sendMagicLinkEmail(email: string, link: string) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[Institution Admin] Magic sign-in link for ${email}: ${link}`);
      await this.delivery.sendEmailOTP(
        email,
        `Use this link to sign in (dev): ${link.slice(0, 40)}...`,
      );
      return;
    }
    await this.delivery.sendEmailOTP(email, `Sign in: ${link}`);
  }

  async consumeMagicLink(token: string, email: string) {
    const admin = await this.prisma.institutionAdmin.findUnique({
      where: { primary_email: email.trim().toLowerCase() },
    });
    if (!admin || !admin.magic_link_token_hash || !admin.magic_link_expires_at) {
      throw new BadRequestException('Invalid magic link');
    }
    if (new Date() > admin.magic_link_expires_at) {
      throw new BadRequestException('Magic link expired');
    }

    const valid = await this.passwordService.verifyPassword(token, admin.magic_link_token_hash);
    if (!valid) throw new BadRequestException('Invalid magic link');

    await this.prisma.institutionAdmin.update({
      where: { id: admin.id },
      data: { magic_link_token_hash: null, magic_link_expires_at: null },
    });

    const sessionId = uuidv4();
    await this.prisma.institutionAdminSigninSession.create({
      data: {
        session_id: sessionId,
        institution_admin_id: admin.id,
        password_verified: true,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      sessionId,
      institutionAdminId: admin.id,
      onboardingCompleted: admin.onboarding_completed,
      maskedEmail: this.maskEmail(admin.primary_email),
      maskedPhone: this.maskPhone(admin.primary_phone),
    };
  }

  async onboardingStatus(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);
    return {
      onboardingCompleted: admin.onboarding_completed,
      hasUserId: !!admin.user_id,
      hasTotp: !!admin.totp_secret,
      hasAltContact: !!(admin.alternative_email && admin.alternative_phone),
    };
  }

  async resetPassword(sessionId: string, newPassword: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);
    const hash = await this.passwordService.hashPassword(newPassword);
    const userId = admin.user_id || this.otpService.generateUserId(admin.full_name);

    await this.prisma.institutionAdmin.update({
      where: { id: admin.id },
      data: { password_hash: hash, user_id: userId },
    });

    return { userId, message: 'Password updated. User ID assigned.' };
  }

  async totpSetup(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);
    const { secret, qrCodeUrl } = this.otpService.generateTotpSecret(admin.primary_email);
    const qrCodeDataUrl = await this.otpService.generateQrCodeDataUrl(qrCodeUrl);

    await this.prisma.institutionAdmin.update({
      where: { id: admin.id },
      data: { totp_secret: secret },
    });

    return { qrCodeDataUrl, secret };
  }

  async totpVerify(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);
    if (!admin.totp_secret || !this.otpService.verifyTotp(admin.totp_secret, code)) {
      throw new BadRequestException('Invalid authenticator code');
    }
    return { verified: true };
  }

  async setAltContact(
    sessionId: string,
    dto: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);

    if (dto.altEmail.trim().toLowerCase() === admin.primary_email) {
      throw new BadRequestException('Alternative email cannot match primary email');
    }

    await this.prisma.institutionAdmin.update({
      where: { id: admin.id },
      data: {
        alternative_email: dto.altEmail.trim().toLowerCase(),
        alternative_phone: dto.altPhone.replace(/\s+/g, ''),
      },
    });

    return { success: true };
  }

  async completeOnboarding(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.institution_admin_id!);

    if (!admin.user_id || !admin.totp_secret || !admin.alternative_email) {
      throw new BadRequestException('Complete password reset, authenticator, and alternative contact first');
    }

    await this.prisma.institutionAdmin.update({
      where: { id: admin.id },
      data: { onboarding_completed: true },
    });

    const tokens = await this.auth.createSession(admin.id);
    await this.prisma.institutionAdminSigninSession.deleteMany({ where: { session_id: sessionId } });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: admin.user_id,
      email: admin.primary_email,
    };
  }

  async listPendingApprovals() {
    return this.prisma.institutionAdminApprovalRequest.findMany({
      where: { status: 'pending' },
      include: {
        institution_admin: {
          select: { full_name: true, primary_email: true, user_id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async approveRequest(requestId: string) {
    const req = await this.prisma.institutionAdminApprovalRequest.findUnique({
      where: { id: requestId },
    });
    if (!req || req.status !== 'pending') throw new NotFoundException('Request not found');

    await this.prisma.institutionAdminApprovalRequest.update({
      where: { id: requestId },
      data: { status: 'approved' },
    });

    return { approved: true, institutionAdminId: req.institution_admin_id };
  }

  private maskEmail(email: string) {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}****@${domain}`;
  }

  private maskPhone(phone: string) {
    return `+91 ****${phone.slice(-4)}`;
  }

  async getSigninSession(sessionId: string) {
    const session = await this.prisma.institutionAdminSigninSession.findUnique({
      where: { session_id: sessionId },
    });
    if (!session || new Date() > session.expires_at) {
      throw new BadRequestException('Invalid or expired session');
    }
    return session;
  }

  async getAdmin(id: string) {
    const admin = await this.prisma.institutionAdmin.findUnique({ where: { id } });
    if (!admin) throw new BadRequestException('Platform admin not found');
    return admin;
  }
}


