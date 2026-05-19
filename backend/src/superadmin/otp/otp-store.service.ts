import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpDeliveryService } from './otp-delivery.service';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpStoreService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private delivery: OtpDeliveryService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(
    identifier: string,
    type: 'email' | 'sms' | 'phone',
  ): Promise<{ sent: boolean; devOtp?: string; message?: string }> {
    const otp = this.generateOtp();
    const otpHash = await this.passwordService.hashPassword(otp);
    const normalizedId = this.normalizeIdentifier(identifier, type);

    await this.prisma.oTPStore.create({
      data: {
        identifier: normalizedId,
        otp_hash: otpHash,
        type: type === 'phone' ? 'sms' : type,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    if (type === 'email') {
      await this.delivery.sendEmailOTP(identifier, otp);
    } else {
      await this.delivery.sendSMSOTP(identifier, otp);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      sent: true,
      ...(isDev && {
        devOtp: otp,
        message: 'Development mode: use this OTP or check DevOTP dashboard / backend logs.',
      }),
    };
  }

  private normalizeIdentifier(identifier: string, type: string): string {
    const trimmed = identifier.trim();
    if (type === 'email') return trimmed.toLowerCase();
    return trimmed.replace(/\s+/g, '');
  }

  async verifyOtp(identifier: string, type: string, otp: string): Promise<boolean> {
    const normalizedId = this.normalizeIdentifier(identifier, type);
    const otpType = type === 'phone' ? 'sms' : type;

    const record = await this.prisma.oTPStore.findFirst({
      where: {
        identifier: normalizedId,
        type: otpType,
        used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Maximum OTP attempts exceeded');
    }

    const valid = await this.passwordService.verifyPassword(otp, record.otp_hash);

    await this.prisma.oTPStore.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });

    if (valid) {
      await this.prisma.oTPStore.update({
        where: { id: record.id },
        data: { used: true },
      });
      return true;
    }

    return false;
  }
}
