import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { OtpStoreService } from '@/superadmin/otp/otp-store.service';
import { PlatformAdminAuthService } from './platform-admin-auth.service';
import { PlatformAdminService } from './platform-admin.service';
import { v4 as uuidv4 } from 'uuid';

const PRIMARY_OTP_SEND_LIMIT = 5;
const ALT_OTP_SEND_LIMIT = 3;
const PRIMARY_OTP_VERIFY_LIMIT = 5;
const ALT_OTP_VERIFY_LIMIT = 3;

interface SigninDraft {
  primaryOtpSends?: number;
  altOtpSends?: number;
  pendingRecoveryCode?: string;
}

@Injectable()
export class PlatformAdminSigninService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private otpStore: OtpStoreService,
    private auth: PlatformAdminAuthService,
    private platformAdminService: PlatformAdminService,
  ) {}

  private detectIdentifierType(value: string): 'email' | 'user_id' | 'phone' {
    if (value.includes('@')) return 'email';
    if (value.startsWith('PRGEEQ')) return 'user_id';
    return 'phone';
  }

  async primarySignin(identifier: string, password: string) {
    const type = this.detectIdentifierType(identifier);
    const where =
      type === 'email'
        ? { primary_email: identifier.toLowerCase() }
        : type === 'user_id'
          ? { user_id: identifier.toUpperCase() }
          : { primary_phone: identifier };

    const admin = await this.prisma.platformAdmin.findFirst({ where });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    if (!admin.onboarding_completed) {
      throw new BadRequestException('Complete onboarding via magic link first');
    }

    if (admin.is_locked && admin.lock_expires_at && new Date() < admin.lock_expires_at) {
      throw new ForbiddenException('Account locked. Try again later.');
    }

    const match = await this.passwordService.verifyPassword(password, admin.password_hash);
    if (!match) throw new UnauthorizedException('Invalid Password');

    const sessionId = uuidv4();
    await this.prisma.platformAdminSigninSession.create({
      data: {
        session_id: sessionId,
        platform_admin_id: admin.id,
        password_verified: true,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      sessionId,
      platformAdminId: admin.id,
      maskedEmail: this.maskEmail(admin.primary_email),
      maskedPhone: this.maskPhone(admin.primary_phone),
    };
  }

  async sendPrimaryOtp(sessionId: string, method: 'email' | 'phone') {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    this.assertCanSendOtp(session, 'primary');

    const target = method === 'email' ? admin.primary_email : admin.primary_phone;
    const type = method === 'email' ? 'email' : 'sms';
    const result = await this.otpStore.sendOtp(target, type);
    const updated = await this.recordOtpSend(sessionId, 'primary');

    return {
      ...result,
      sendCount: updated.count,
      sendLimit: PRIMARY_OTP_SEND_LIMIT,
      sendsRemaining: updated.remaining,
      sendLimitReached: updated.remaining === 0,
    };
  }

  async verifyPrimaryOtp(sessionId: string, method: 'email' | 'phone', otp: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    const target = method === 'email' ? admin.primary_email : admin.primary_phone;
    const type = method === 'email' ? 'email' : 'sms';

    let valid = false;
    try {
      valid = await this.otpStore.verifyOtp(target, type, otp);
    } catch {
      valid = false;
    }

    if (valid) return this.completeSignin(sessionId, admin.id);

    const failed = admin.failed_primary_otp + 1;
    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { failed_primary_otp: failed },
    });

    const remaining = Math.max(0, PRIMARY_OTP_VERIFY_LIMIT - failed);
    if (failed >= PRIMARY_OTP_VERIFY_LIMIT) {
      return {
        exhausted: true,
        attemptsRemaining: 0,
        attemptsLimit: PRIMARY_OTP_VERIFY_LIMIT,
        message: 'Primary OTP failed. Switching to alternative contact.',
      };
    }

    return { valid: false, exhausted: false, attemptsRemaining: remaining, attemptsLimit: PRIMARY_OTP_VERIFY_LIMIT };
  }

  async sendAltOtp(sessionId: string, method: 'email' | 'phone') {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    if (!admin.alternative_email && !admin.alternative_phone) {
      return { skip: true };
    }

    this.assertCanSendOtp(session, 'alt');
    const target = method === 'email' ? admin.alternative_email! : admin.alternative_phone!;
    const result = await this.otpStore.sendOtp(target, method === 'email' ? 'email' : 'sms');
    const updated = await this.recordOtpSend(sessionId, 'alt');

    return {
      ...result,
      maskedEmail: admin.alternative_email ? this.maskEmail(admin.alternative_email) : null,
      maskedPhone: admin.alternative_phone ? this.maskPhone(admin.alternative_phone) : null,
      sendCount: updated.count,
      sendLimit: ALT_OTP_SEND_LIMIT,
      sendsRemaining: updated.remaining,
      sendLimitReached: updated.remaining === 0,
    };
  }

  async verifyAltOtp(sessionId: string, method: 'email' | 'phone', otp: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    const target = method === 'email' ? admin.alternative_email! : admin.alternative_phone!;
    const type = method === 'email' ? 'email' : 'sms';

    let valid = false;
    try {
      valid = await this.otpStore.verifyOtp(target, type, otp);
    } catch {
      valid = false;
    }

    if (valid) return this.completeSignin(sessionId, admin.id);

    const failed = admin.failed_alt_otp + 1;
    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { failed_alt_otp: failed },
    });

    const remaining = Math.max(0, ALT_OTP_VERIFY_LIMIT - failed);
    if (failed >= ALT_OTP_VERIFY_LIMIT) {
      return {
        exhausted: true,
        attemptsRemaining: 0,
        attemptsLimit: ALT_OTP_VERIFY_LIMIT,
        message: 'Alternative OTP failed. Switching to authenticator.',
      };
    }

    return { valid: false, exhausted: false, attemptsRemaining: remaining, attemptsLimit: ALT_OTP_VERIFY_LIMIT };
  }

  async verifyTotp(sessionId: string, code: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    if (!admin.totp_secret || !this.otpService.verifyTotp(admin.totp_secret, code)) {
      return { matched: false };
    }
    return this.completeSignin(sessionId, admin.id);
  }

  async verifyRecovery(sessionId: string, code: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);
    if (!admin.recovery_code_hash) return { matched: false };

    const valid = await this.passwordService.verifyPassword(code, admin.recovery_code_hash);
    if (!valid) return { matched: false };

    const newCode = this.otpService.generateRecoveryCode();
    const newHash = await this.passwordService.hashPassword(newCode);
    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { recovery_code_hash: newHash },
    });

    const draft = this.getSigninDraft(session);
    await this.prisma.platformAdminSigninSession.update({
      where: { session_id: sessionId },
      data: { draft_data: { ...draft, pendingRecoveryCode: newCode } as object },
    });

    return { matched: true, newRecoveryCode: newCode, requiresApproval: true };
  }

  async requestSuperAdminApproval(sessionId: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);

    const existing = await this.prisma.platformAdminApprovalRequest.findFirst({
      where: { platform_admin_id: admin.id, status: 'pending' },
    });
    if (existing) {
      return { requestId: existing.id, status: 'pending', message: 'Approval already requested' };
    }

    const req = await this.prisma.platformAdminApprovalRequest.create({
      data: {
        platform_admin_id: admin.id,
        session_id: sessionId,
        status: 'pending',
      },
    });

    return {
      requestId: req.id,
      status: 'pending',
      message: 'Super Admin approval requested. You will be notified when approved.',
    };
  }

  async checkApprovalAndSignin(sessionId: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const admin = await this.platformAdminService.getAdmin(session.platform_admin_id!);

    const approved = await this.prisma.platformAdminApprovalRequest.findFirst({
      where: { platform_admin_id: admin.id, status: 'approved' },
      orderBy: { updated_at: 'desc' },
    });

    if (!approved) {
      return { approved: false, message: 'Waiting for Super Admin approval' };
    }

    return this.completeSignin(sessionId, admin.id);
  }

  private async completeSignin(sessionId: string, platformAdminId: string) {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const draft = this.getSigninDraft(session);
    const admin = await this.platformAdminService.getAdmin(platformAdminId);
    const tokens = await this.auth.createSession(platformAdminId);

    await this.prisma.platformAdminSigninSession.deleteMany({ where: { session_id: sessionId } });
    await this.prisma.platformAdmin.update({
      where: { id: platformAdminId },
      data: { failed_primary_otp: 0, failed_alt_otp: 0, is_locked: false, lock_expires_at: null },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: admin.user_id,
      email: admin.primary_email,
      ...(draft.pendingRecoveryCode && { newRecoveryCode: draft.pendingRecoveryCode }),
    };
  }

  private getSigninDraft(session: { draft_data: unknown }): SigninDraft {
    return (session.draft_data as SigninDraft) || {};
  }

  private assertCanSendOtp(session: { draft_data: unknown }, channel: 'primary' | 'alt') {
    const draft = this.getSigninDraft(session);
    const limit = channel === 'primary' ? PRIMARY_OTP_SEND_LIMIT : ALT_OTP_SEND_LIMIT;
    const count = channel === 'primary' ? (draft.primaryOtpSends ?? 0) : (draft.altOtpSends ?? 0);
    if (count >= limit) {
      throw new BadRequestException(
        channel === 'primary'
          ? `Primary OTP send limit reached (${limit})`
          : `Alternative OTP send limit reached (${limit})`,
      );
    }
  }

  private async recordOtpSend(sessionId: string, channel: 'primary' | 'alt') {
    const session = await this.platformAdminService.getSigninSession(sessionId);
    const draft = this.getSigninDraft(session);
    const limit = channel === 'primary' ? PRIMARY_OTP_SEND_LIMIT : ALT_OTP_SEND_LIMIT;
    const key = channel === 'primary' ? 'primaryOtpSends' : 'altOtpSends';
    const count = (draft[key] ?? 0) + 1;

    await this.prisma.platformAdminSigninSession.update({
      where: { session_id: sessionId },
      data: { draft_data: { ...draft, [key]: count } as object },
    });

    return { count, limit, remaining: Math.max(0, limit - count) };
  }

  private maskEmail(email: string) {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}****@${domain}`;
  }

  private maskPhone(phone: string) {
    return `+91 ****${phone.slice(-4)}`;
  }
}
