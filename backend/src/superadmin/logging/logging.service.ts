import { Injectable } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';

@Injectable()
export class LoggingService {
  private logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
  });

  log(action: string, meta?: Record<string, unknown>) {
    this.logger.info(action, meta);
  }

  error(action: string, meta?: Record<string, unknown>) {
    this.logger.error(action, meta);
  }
}
