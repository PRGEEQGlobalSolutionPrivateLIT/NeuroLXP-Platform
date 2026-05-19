import { Module } from '@nestjs/common';
import { AuditLogService } from './audit.service';
import { LoggingModule } from '@/superadmin/logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
