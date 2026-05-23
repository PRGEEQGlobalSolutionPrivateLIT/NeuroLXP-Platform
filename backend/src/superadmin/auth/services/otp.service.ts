import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import {
  generateApprovalCode,
  generateRecoveryCode,
  generateSecurityCodes,
  generateUserId,
} from '@/superadmin/common/id-generator';

export type TotpActorType =
  | 'superadmin'
  | 'platform-admin'
  | 'institution-admin'
  | 'student'
  | 'faculty'
  | 'coordinator';

const TOTP_ACTOR_LABELS: Record<TotpActorType, string> = {
  superadmin: 'NeuroLXP Super Admin',
  'platform-admin': 'NeuroLXP Platform Admin',
  'institution-admin': 'NeuroLXP Institution Admin',
  student: 'NeuroLXP Student',
  faculty: 'NeuroLXP Faculty',
  coordinator: 'NeuroLXP Coordinator',
};

@Injectable()
export class OtpService {
  generateTotpSecret(
    email: string,
    actor: TotpActorType = 'superadmin',
  ): { secret: string; qrCodeUrl: string } {
    const issuer = TOTP_ACTOR_LABELS[actor];
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${email})`,
      issuer,
      length: 32,
    });
    return {
      secret: secret.base32 || '',
      qrCodeUrl: secret.otpauth_url || '',
    };
  }

  async generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl);
  }

  verifyTotp(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  generateUserId = generateUserId;
  generateRecoveryCode = generateRecoveryCode;
  generateSecurityCodes = generateSecurityCodes;
  generateApprovalCode = generateApprovalCode;
}
