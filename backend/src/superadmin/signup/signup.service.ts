import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { OtpStoreService } from '@/superadmin/otp/otp-store.service';
import { LoggingService } from '@/superadmin/logging/logging.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface SignupDraft {
  full_name?: string;
  date_of_birth?: string;
  primary_email?: string;
  primary_phone?: string;
  primary_email_verified?: boolean;
  primary_phone_verified?: boolean;
  password_hash?: string;
  user_id?: string;
  alternative_email?: string;
  alternative_phone?: string;
  alt_email_verified?: boolean;
  alt_phone_verified?: boolean;
  totp_secret?: string;
  recovery_code?: string;
  recovery_code_hash?: string;
  security_codes?: { code: string; hash: string; used: boolean }[];
  selfie_image_path?: string;
  govt_id_type?: string;
  govt_id_hash?: string;
  security_question_1?: string;
  answer_1?: string;
  security_question_2?: string;
  answer_2?: string;
  security_question_3?: string;
  answer_3?: string;
  approver_name?: string;
  approver_designation?: string;
  approver_email?: string;
  approver_phone?: string;
  approver_email_verified?: boolean;
  approver_phone_verified?: boolean;
  declarations_accepted?: Record<string, boolean>;
}

@Injectable()
export class SignupService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private otpStore: OtpStoreService,
    private logging: LoggingService,
  ) {}

  async initializeSignup() {
    const sessionId = uuidv4();
    await this.prisma.signupSession.create({
      data: {
        session_id: sessionId,
        current_step: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    this.logging.log('signup_initialized', { sessionId });
    return { sessionId, step: 1 };
  }

  private async getSession(sessionId: string) {
    const session = await this.prisma.signupSession.findUnique({
      where: { session_id: sessionId },
    });
    if (!session || new Date() > session.expires_at) {
      throw new BadRequestException('Invalid or expired signup session');
    }
    return session;
  }

  private async updateDraft(sessionId: string, patch: SignupDraft, step?: number) {
    const session = await this.getSession(sessionId);
    const draft = { ...(session.draft_data as SignupDraft), ...patch };
    const completed = step
      ? [...new Set([...session.completed_steps, step])]
      : session.completed_steps;

    return this.prisma.signupSession.update({
      where: { session_id: sessionId },
      data: {
        draft_data: draft as object,
        completed_steps: completed,
        current_step: step ? step + 1 : session.current_step,
      },
    });
  }

  async saveStep1(sessionId: string, fullName: string, dateOfBirth: string) {
    await this.updateDraft(sessionId, { full_name: fullName, date_of_birth: dateOfBirth }, 1);
    return { success: true };
  }

  async sendOtp(sessionId: string, identifier: string, type: 'email' | 'sms' | 'phone') {
    await this.getSession(sessionId);
    return this.otpStore.sendOtp(identifier, type);
  }

  async verifyOtp(
    sessionId: string,
    identifier: string,
    type: 'email' | 'sms' | 'phone',
    otp: string,
    field: string,
  ) {
    await this.getSession(sessionId);
    const valid = await this.otpStore.verifyOtp(identifier, type, otp);
    if (!valid) throw new BadRequestException('Invalid OTP');
    await this.updateDraft(sessionId, { [field]: true } as SignupDraft);
    return { verified: true };
  }

  async saveStep2Contact(
    sessionId: string,
    primaryEmail: string,
    primaryPhone: string,
    emailVerified: boolean,
    phoneVerified: boolean,
  ) {
    if (!emailVerified || !phoneVerified) {
      throw new BadRequestException('Primary email and phone must be verified');
    }
    await this.updateDraft(
      sessionId,
      { primary_email: primaryEmail, primary_phone: primaryPhone, primary_email_verified: true, primary_phone_verified: true },
      2,
    );
    return { success: true };
  }

  async savePassword(sessionId: string, password: string) {
    const hash = await this.passwordService.hashPassword(password);
    await this.updateDraft(sessionId, { password_hash: hash });
    return { success: true };
  }

  async generateUserId(sessionId: string) {
    const session = await this.getSession(sessionId);
    const draft = session.draft_data as SignupDraft;
    if (!draft.full_name) throw new BadRequestException('Complete step 1 first');
    const userId = this.otpService.generateUserId(draft.full_name);
    await this.updateDraft(sessionId, { user_id: userId }, 3);
    return { userId };
  }

  async saveAltContact(
    sessionId: string,
    altEmail: string,
    altPhone: string,
    emailVerified: boolean,
    phoneVerified: boolean,
  ) {
    if (!emailVerified || !phoneVerified) {
      throw new BadRequestException('Alternative contacts must be verified');
    }
    await this.updateDraft(
      sessionId,
      { alternative_email: altEmail, alternative_phone: altPhone, alt_email_verified: true, alt_phone_verified: true },
      4,
    );
    return { success: true };
  }

  async setupTotp(sessionId: string) {
    const session = await this.getSession(sessionId);
    const draft = session.draft_data as SignupDraft;
    const email = draft.primary_email || 'admin@neurolxp.com';
    const { secret, qrCodeUrl } = this.otpService.generateTotpSecret(email, 'superadmin');
    const qrCodeDataUrl = await this.otpService.generateQrCodeDataUrl(qrCodeUrl);
    await this.updateDraft(sessionId, { totp_secret: secret });
    return { secret, qrCodeDataUrl };
  }

  async verifyTotp(sessionId: string, code: string) {
    const session = await this.getSession(sessionId);
    const draft = session.draft_data as SignupDraft;
    if (!draft.totp_secret || !this.otpService.verifyTotp(draft.totp_secret, code)) {
      throw new BadRequestException('Code not matched. Try again.');
    }
    await this.updateDraft(sessionId, {}, 5);
    return { verified: true };
  }

  async generateRecoveryCode(sessionId: string) {
    const code = this.otpService.generateRecoveryCode();
    const hash = await this.passwordService.hashPassword(code);
    await this.updateDraft(sessionId, { recovery_code: code, recovery_code_hash: hash }, 6);
    return { recoveryCode: code };
  }

  async generateSecurityCodes(sessionId: string) {
    const plainCodes = this.otpService.generateSecurityCodes(9);
    const hashed = await Promise.all(
      plainCodes.map(async (code) => ({
        code,
        hash: await this.passwordService.hashPassword(code),
        used: false,
      })),
    );
    await this.updateDraft(sessionId, { security_codes: hashed }, 7);
    return { codes: plainCodes };
  }

  async saveIdentity(
    sessionId: string,
    selfieBase64: string,
    govtIdType: string,
    govtIdNumber: string,
  ) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'selfies');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${sessionId}.jpg`;
    const filePath = path.join(uploadsDir, filename);
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const govtHash = await this.passwordService.hashPassword(govtIdNumber);
    await this.updateDraft(
      sessionId,
      {
        selfie_image_path: `uploads/selfies/${filename}`,
        govt_id_type: govtIdType,
        govt_id_hash: govtHash,
      },
      8,
    );
    return { success: true };
  }

  async saveSecurityQA(
    sessionId: string,
    data: {
      q1: string; a1: string; q2: string; a2: string; q3: string; a3: string;
      approverName: string; approverDesignation: string;
      approverEmail: string; approverPhone: string;
    },
  ) {
    await this.updateDraft(sessionId, {
      security_question_1: data.q1,
      answer_1: data.a1,
      security_question_2: data.q2,
      answer_2: data.a2,
      security_question_3: data.q3,
      answer_3: data.a3,
      approver_name: data.approverName,
      approver_designation: data.approverDesignation,
      approver_email: data.approverEmail,
      approver_phone: data.approverPhone,
    }, 9);
    return { success: true };
  }

  async saveDeclarations(sessionId: string, declarations: Record<string, boolean>) {
    await this.updateDraft(sessionId, { declarations_accepted: declarations }, 10);
    return { success: true };
  }

  async getReview(sessionId: string) {
    const session = await this.getSession(sessionId);
    const draft = session.draft_data as SignupDraft;
    return {
      ...draft,
      recovery_code: undefined,
      password_hash: undefined,
      totp_secret: undefined,
      recovery_code_hash: undefined,
      security_codes: undefined,
      govt_id_hash: undefined,
      answer_1: undefined,
      answer_2: undefined,
      answer_3: undefined,
    };
  }

  async completeSignup(sessionId: string) {
    const session = await this.getSession(sessionId);
    const d = session.draft_data as SignupDraft;

    if (!d.full_name || !d.date_of_birth || !d.primary_email || !d.primary_phone ||
        !d.password_hash || !d.user_id || !d.totp_secret || !d.recovery_code_hash ||
        !d.security_codes?.length) {
      throw new BadRequestException('Signup incomplete');
    }

    const existing = await this.prisma.superAdmin.findFirst({
      where: {
        OR: [
          { primary_email: d.primary_email },
          { primary_phone: d.primary_phone },
          { user_id: d.user_id },
        ],
      },
    });
    if (existing) throw new ConflictException('Account already exists');

    const a1 = d.answer_1 ? await this.passwordService.hashPassword(d.answer_1.toLowerCase()) : null;
    const a2 = d.answer_2 ? await this.passwordService.hashPassword(d.answer_2.toLowerCase()) : null;
    const a3 = d.answer_3 ? await this.passwordService.hashPassword(d.answer_3.toLowerCase()) : null;

    const admin = await this.prisma.superAdmin.create({
      data: {
        full_name: d.full_name,
        date_of_birth: new Date(d.date_of_birth!),
        primary_email: d.primary_email,
        primary_phone: d.primary_phone,
        alternative_email: d.alternative_email,
        alternative_phone: d.alternative_phone,
        password_hash: d.password_hash,
        user_id: d.user_id,
        totp_secret: d.totp_secret,
        recovery_code_hash: d.recovery_code_hash,
        security_codes: d.security_codes as object,
        selfie_image_path: d.selfie_image_path,
        govt_id_type: d.govt_id_type,
        govt_id_hash: d.govt_id_hash,
        security_question_1: d.security_question_1,
        answer_1_hash: a1,
        security_question_2: d.security_question_2,
        answer_2_hash: a2,
        security_question_3: d.security_question_3,
        answer_3_hash: a3,
        approver_name: d.approver_name,
        approver_designation: d.approver_designation,
        approver_email: d.approver_email,
        approver_phone: d.approver_phone,
        declarations_accepted: d.declarations_accepted as object,
        is_active: true,
        signup_completed: true,
      },
    });

    await this.prisma.signupSession.delete({ where: { session_id: sessionId } });
    this.logging.log('signup_completed', { adminId: admin.id });

    return {
      userId: d.user_id,
      email: d.primary_email,
      recoveryCode: d.recovery_code,
      securityCodes: (d.security_codes || []).map((c) => c.code),
    };
  }

  async getProgress(sessionId: string) {
    const session = await this.getSession(sessionId);
    return {
      currentStep: session.current_step,
      completedSteps: session.completed_steps,
      expiresAt: session.expires_at,
    };
  }

  async cancelSignup(sessionId: string) {
    await this.prisma.signupSession.deleteMany({ where: { session_id: sessionId } });
  }
}
