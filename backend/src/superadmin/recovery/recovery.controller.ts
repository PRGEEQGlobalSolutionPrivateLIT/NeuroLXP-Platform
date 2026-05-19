import { Controller, Get, Param } from '@nestjs/common';
import { RecoveryService } from './recovery.service';

@Controller('api/auth/recovery')
export class RecoveryController {
  constructor(private recoveryService: RecoveryService) {}

  @Get('options/:superAdminId')
  getRecoveryOptions(@Param('superAdminId') superAdminId: string) {
    return this.recoveryService.getRecoveryOptions(superAdminId);
  }

  @Get('lock-status/:superAdminId')
  getAccountLockStatus(@Param('superAdminId') superAdminId: string) {
    return this.recoveryService.getLockStatus(superAdminId);
  }

  @Get('backup-codes-count/:superAdminId')
  getBackupCodesCount(@Param('superAdminId') superAdminId: string) {
    return this.recoveryService.getBackupCodesCount(superAdminId);
  }
}
