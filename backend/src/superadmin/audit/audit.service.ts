import { Injectable } from '@nestjs/common';
import { LoggingService } from '@/superadmin/logging/logging.service';

@Injectable()
export class AuditLogService {
  constructor(private logging: LoggingService) {}

  async createAuditLog(
    action: string,
    resourceType: string,
    resourceId: string | undefined,
    superAdminId: string | undefined,
    description: string,
    status: string,
  ) {
    this.logging.log(action, { resourceType, resourceId, superAdminId, description, status });
  }

  async getAuditLogs(_superAdminId: string) {
    return [];
  }
}
