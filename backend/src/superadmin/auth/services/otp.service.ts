import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import {
  generateApprovalCode,
  generateRecoveryCode,
  generateSecurityCodes,
  generateUserId,
} from '@/superadmin/common/id-generator';

@Injectable()
export class OtpService {
  generateTotpSecret(email: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `NeuroLXP SuperAdmin (${email})`,
      issuer: 'NeuroLXP',
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
