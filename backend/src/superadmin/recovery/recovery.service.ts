import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RecoveryService {
  constructor(private prisma: PrismaService) {}

  async getRecoveryOptions(superAdminId: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    if (!admin) return null;
    const codes = (admin.security_codes as { used: boolean }[]) || [];
    return {
      hasRecoveryCode: !!admin.recovery_code_hash,
      hasTotp: !!admin.totp_secret,
      securityCodesRemaining: codes.filter((c) => !c.used).length,
      alternativeEmail: admin.alternative_email,
      alternativePhone: admin.alternative_phone,
    };
  }

  async getLockStatus(superAdminId: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    if (!admin) return { isLocked: false };
    return {
      isLocked: admin.is_locked,
      lockExpiresAt: admin.lock_expires_at,
    };
  }

  async getBackupCodesCount(superAdminId: string) {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: superAdminId } });
    const codes = (admin?.security_codes as { used: boolean }[]) || [];
    return { count: codes.filter((c) => !c.used).length };
  }
}
