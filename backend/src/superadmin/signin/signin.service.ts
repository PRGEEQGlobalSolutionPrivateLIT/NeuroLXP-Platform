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
import { OtpDeliveryService } from '@/superadmin/otp/otp-delivery.service';
import { AuthenticationService } from '@/superadmin/auth/services/authentication.service';
import { LoggingService } from '@/superadmin/logging/logging.service';
import { appendSigninLog } from '@/superadmin/common/signin-log';
import { v4 as uuidv4 } from 'uuid';

const PRIMARY_OTP_SEND_LIMIT = 5;
const ALT_OTP_SEND_LIMIT = 3;
const PRIMARY_OTP_VERIFY_LIMIT = 5;
const ALT_OTP_VERIFY_LIMIT = 3;

interface SigninDraft {
  primaryOtpSends?: number;
  altOtpSends?: number;
}

@Injectable()
export class SigninService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private otpStore: OtpStoreService,
    private delivery: OtpDeliveryService,
    private authService: AuthenticationService,
    private logging: LoggingService,
  ) {}

  private maskEmail(email: string) {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}****@${domain}`;
  }

  private maskPhone(phone: string) {
    return `+91 ****${phone.slice(-4)}`;
  }

  private async logAttempt(
    adminId: string,
    action: string,
    method: string,
    status: 'success' | 'failed',
    meta?: { ipAddress?: string; deviceInfo?: string },
  ) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin) return;
    const logs = appendSigninLog(admin.signin_log, {
      timestamp: new Date().toISOString(),
      action,
      method,
      status,
      ...meta,
    });
    await this.prisma.superAdmin.update({
      where: { id: adminId },
      data: { signin_log: logs as object },
    });
    this.logging.log(action, { adminId, method, status });
  }

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

    const admin = await this.prisma.superAdmin.findFirst({ where });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    if (admin.is_locked && admin.lock_expires_at && new Date() < admin.lock_expires_at) {
      throw new ForbiddenException('Account locked. Try again later.');
    }

    const match = await this.passwordService.verifyPassword(password, admin.password_hash);
    if (!match) {
      await this.logAttempt(admin.id, 'signin_primary', 'password', 'failed');
      throw new UnauthorizedException('Invalid Password');
    }

    const sessionId = uuidv4();
    await this.prisma.signinSession.create({
      data: {
        session_id: sessionId,
        admin_id: admin.id,
        password_verified: true,
        current_step: 2,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.logAttempt(admin.id, 'signin_primary', 'password', 'success');

    return {
      sessionId,
      superAdminId: admin.id,
      passwordMatched: true,
      maskedEmail: this.maskEmail(admin.primary_email),
      maskedPhone: this.maskPhone(admin.primary_phone),
      currentStep: 2,
    };
  }

  async forgotPassword(identifier: string, newPassword: string, otp: string) {
    const type = this.detectIdentifierType(identifier);
    const where =
      type === 'email'
        ? { primary_email: identifier.toLowerCase() }
        : type === 'user_id'
          ? { user_id: identifier.toUpperCase() }
          : { primary_phone: identifier };

    const admin = await this.prisma.superAdmin.findFirst({ where });
    if (!admin) throw new BadRequestException('Account not found');

    const valid = await this.otpStore.verifyOtp(admin.primary_email, 'email', otp);
    if (!valid) throw new BadRequestException('Invalid OTP');

    const hash = await this.passwordService.hashPassword(newPassword);
    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { password_hash: hash },
    });
    return { success: true, message: 'Password Reset Successful' };
  }

  async sendPrimaryOtp(sessionId: string, method: 'email' | 'phone') {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
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
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    const target = method === 'email' ? admin.primary_email : admin.primary_phone;
    const type = method === 'email' ? 'email' : 'sms';

    try {
      const valid = await this.otpStore.verifyOtp(target, type, otp);
      if (valid) {
        await this.logAttempt(admin.id, 'signin_otp_primary', `${method}_otp`, 'success');
        return this.completeSignin(sessionId, admin.id);
      }
    } catch {
      /* invalid or expired OTP record */
    }

    const failed = admin.failed_primary_otp + 1;
    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { failed_primary_otp: failed },
    });
    await this.logAttempt(admin.id, 'signin_otp_primary', `${method}_otp`, 'failed');

    const remaining = Math.max(0, PRIMARY_OTP_VERIFY_LIMIT - failed);
    if (failed >= PRIMARY_OTP_VERIFY_LIMIT) {
      return {
        exhausted: true,
        nextStep: 3,
        attemptsUsed: failed,
        attemptsLimit: PRIMARY_OTP_VERIFY_LIMIT,
        attemptsRemaining: 0,
        message: 'Primary OTP verification failed. Switching to alternative contact.',
      };
    }

    return {
      valid: false,
      exhausted: false,
      attemptsUsed: failed,
      attemptsLimit: PRIMARY_OTP_VERIFY_LIMIT,
      attemptsRemaining: remaining,
    };
  }

  async sendAltOtp(sessionId: string, method: 'email' | 'phone') {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    if (!admin.alternative_email && !admin.alternative_phone) {
      return { skip: true, nextStep: 4 };
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
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    const target = method === 'email' ? admin.alternative_email! : admin.alternative_phone!;
    const type = method === 'email' ? 'email' : 'sms';

    let valid = false;
    try {
      valid = await this.otpStore.verifyOtp(target, type, otp);
    } catch {
      valid = false;
    }

    if (valid) {
      await this.logAttempt(admin.id, 'signin_otp_alt', `${method}_otp`, 'success');
      return this.completeSignin(sessionId, admin.id);
    }

    const failed = admin.failed_alt_otp + 1;
    await this.prisma.superAdmin.update({ where: { id: admin.id }, data: { failed_alt_otp: failed } });
    await this.logAttempt(admin.id, 'signin_otp_alt', `${method}_otp`, 'failed');

    const remaining = Math.max(0, ALT_OTP_VERIFY_LIMIT - failed);
    if (failed >= ALT_OTP_VERIFY_LIMIT) {
      return {
        exhausted: true,
        nextStep: 4,
        attemptsUsed: failed,
        attemptsLimit: ALT_OTP_VERIFY_LIMIT,
        attemptsRemaining: 0,
        message: 'Alternative OTP verification failed. Switching to authenticator.',
      };
    }

    return {
      valid: false,
      exhausted: false,
      attemptsUsed: failed,
      attemptsLimit: ALT_OTP_VERIFY_LIMIT,
      attemptsRemaining: remaining,
    };
  }

  async verifyTotp(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    if (!admin.totp_secret || !this.otpService.verifyTotp(admin.totp_secret, code)) {
      await this.logAttempt(admin.id, 'signin_totp', 'totp', 'failed');
      return { matched: false, nextStep: 5 };
    }
    await this.logAttempt(admin.id, 'signin_totp', 'totp', 'success');
    return this.completeSignin(sessionId, admin.id);
  }

  async verifyRecoveryCode(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    if (!admin.recovery_code_hash) return { matched: false, nextStep: 6 };

    const valid = await this.passwordService.verifyPassword(code, admin.recovery_code_hash);
    if (!valid) {
      await this.logAttempt(admin.id, 'signin_recovery', 'recovery_code', 'failed');
      return { matched: false, nextStep: 6 };
    }

    const newCode = this.otpService.generateRecoveryCode();
    const newHash = await this.passwordService.hashPassword(newCode);
    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { recovery_code_hash: newHash },
    });
    await this.logAttempt(admin.id, 'signin_recovery', 'recovery_code', 'success');
    return { matched: true, newRecoveryCode: newCode, requiresAck: true };
  }

  async acknowledgeRecoveryAndSignin(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    return this.completeSignin(sessionId, session.admin_id!);
  }

  async verifySecurityCode(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    const codes = (admin.security_codes as { code: string; hash: string; used: boolean }[]) || [];

    for (let i = 0; i < codes.length; i++) {
      if (codes[i].used) continue;
      const valid = await this.passwordService.verifyPassword(code, codes[i].hash);
      if (valid) {
        codes[i].used = true;
        await this.prisma.superAdmin.update({
          where: { id: admin.id },
          data: { security_codes: codes },
        });
        await this.logAttempt(admin.id, 'signin_security_code', 'security_code', 'success');
        return this.completeSignin(sessionId, admin.id);
      }
    }
    await this.logAttempt(admin.id, 'signin_security_code', 'security_code', 'failed');
    return { matched: false, nextStep: 7 };
  }

  async verifyGovtId(sessionId: string, idNumber: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    if (!admin.govt_id_hash) return { matched: false, nextStep: 8 };

    const valid = await this.passwordService.verifyPassword(idNumber, admin.govt_id_hash);
    if (valid) {
      await this.logAttempt(admin.id, 'signin_govt_id', 'govt_id', 'success');
      return this.completeSignin(sessionId, admin.id);
    }
    await this.logAttempt(admin.id, 'signin_govt_id', 'govt_id', 'failed');
    return { matched: false, nextStep: 8 };
  }

  async getSecurityQuestions(superAdminId: string) {
    const admin = await this.getAdmin(superAdminId);
    return {
      q1: admin.security_question_1,
      q2: admin.security_question_2,
      q3: admin.security_question_3,
    };
  }

  async verifySecurityQuestions(
    sessionId: string,
    answers: { a1: string; a2: string; a3: string },
  ) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);

    const checks = [
      admin.answer_1_hash && answers.a1
        ? this.passwordService.verifyPassword(answers.a1.toLowerCase(), admin.answer_1_hash)
        : Promise.resolve(false),
      admin.answer_2_hash && answers.a2
        ? this.passwordService.verifyPassword(answers.a2.toLowerCase(), admin.answer_2_hash)
        : Promise.resolve(false),
      admin.answer_3_hash && answers.a3
        ? this.passwordService.verifyPassword(answers.a3.toLowerCase(), admin.answer_3_hash)
        : Promise.resolve(false),
    ];
    const results = await Promise.all(checks);
    const correct = results.filter(Boolean).length;

    if (correct === 3) {
      await this.logAttempt(admin.id, 'signin_security_qa', 'security_questions', 'success');
      return this.completeSignin(sessionId, admin.id);
    }
    if (correct === 2) {
      return { partial: true, wrongIndex: results.findIndex((r) => !r), message: 'One more attempt for the wrong answer' };
    }
    await this.logAttempt(admin.id, 'signin_security_qa', 'security_questions', 'failed');
    return { matched: false, nextStep: 9 };
  }

  async requestApproval(sessionId: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);
    if (!admin.approver_email) throw new BadRequestException('No approver configured');

    const code = this.otpService.generateApprovalCode();
    const hash = await this.passwordService.hashPassword(code);
    await this.prisma.approverSession.create({
      data: {
        admin_id: admin.id,
        code_hash: hash,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const otp = this.otpStore.generateOtp();
    await this.delivery.sendEmailOTP(admin.approver_email, code);

    return {
      approverName: admin.approver_name,
      designation: admin.approver_designation,
      maskedEmail: this.maskEmail(admin.approver_email),
      maskedPhone: admin.approver_phone ? this.maskPhone(admin.approver_phone) : null,
    };
  }

  async verifyApproval(sessionId: string, code: string) {
    const session = await this.getSigninSession(sessionId);
    const admin = await this.getAdmin(session.admin_id!);

    const req = await this.prisma.approverSession.findFirst({
      where: { admin_id: admin.id, used: false, expires_at: { gt: new Date() } },
      orderBy: { created_at: 'desc' },
    });
    if (!req) throw new BadRequestException('No pending approval');

    const valid = await this.passwordService.verifyPassword(code, req.code_hash);
    if (!valid) {
      await this.logAttempt(admin.id, 'signin_approver', 'approver_code', 'failed');
      await this.prisma.superAdmin.update({
        where: { id: admin.id },
        data: {
          is_locked: true,
          lock_expires_at: new Date(Date.now() + 5 * 60 * 60 * 1000),
        },
      });
      throw new ForbiddenException('Verification failed. Please wait 5 hours before OTP methods reset.');
    }

    await this.prisma.approverSession.update({ where: { id: req.id }, data: { used: true } });
    await this.logAttempt(admin.id, 'signin_approver', 'approver_code', 'success');
    return this.completeSignin(sessionId, admin.id);
  }

  async completeSignin(sessionId: string, superAdminId: string) {
    const admin = await this.getAdmin(superAdminId);
    const tokens = await this.authService.createSession(superAdminId);

    await this.prisma.signinSession.deleteMany({ where: { session_id: sessionId } });
    await this.prisma.superAdmin.update({
      where: { id: superAdminId },
      data: {
        failed_primary_otp: 0,
        failed_alt_otp: 0,
        is_locked: false,
        lock_expires_at: null,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: admin.user_id,
      email: admin.primary_email,
    };
  }

  private getSigninDraft(session: { draft_data: unknown }): SigninDraft {
    return (session.draft_data as SigninDraft) || {};
  }

  private assertCanSendOtp(
    session: { draft_data: unknown },
    channel: 'primary' | 'alt',
  ): { count: number; limit: number; remaining: number } {
    const draft = this.getSigninDraft(session);
    const limit = channel === 'primary' ? PRIMARY_OTP_SEND_LIMIT : ALT_OTP_SEND_LIMIT;
    const count = channel === 'primary' ? (draft.primaryOtpSends ?? 0) : (draft.altOtpSends ?? 0);

    if (count >= limit) {
      throw new BadRequestException(
        channel === 'primary'
          ? `Primary OTP send limit reached (${limit}). Verify with your last code or use alternative contact.`
          : `Alternative OTP send limit reached (${limit}). Continue to the next verification method.`,
      );
    }

    return { count, limit, remaining: limit - count };
  }

  private async recordOtpSend(sessionId: string, channel: 'primary' | 'alt') {
    const session = await this.getSigninSession(sessionId);
    const draft = this.getSigninDraft(session);
    const limit = channel === 'primary' ? PRIMARY_OTP_SEND_LIMIT : ALT_OTP_SEND_LIMIT;
    const key = channel === 'primary' ? 'primaryOtpSends' : 'altOtpSends';
    const count = (draft[key] ?? 0) + 1;

    await this.prisma.signinSession.update({
      where: { session_id: sessionId },
      data: { draft_data: { ...draft, [key]: count } as object },
    });

    return { count, limit, remaining: Math.max(0, limit - count) };
  }

  private async getSigninSession(sessionId: string) {
    const session = await this.prisma.signinSession.findUnique({ where: { session_id: sessionId } });
    if (!session || new Date() > session.expires_at) {
      throw new BadRequestException('Invalid or expired signin session');
    }
    return session;
  }

  private async getAdmin(id: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id } });
    if (!admin) throw new BadRequestException('Admin not found');
    return admin;
  }
}
