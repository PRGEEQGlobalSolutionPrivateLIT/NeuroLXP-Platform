import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Super Admin Authentication System API - v1.0.0';
  }

  getStatus(): { status: string; version: string } {
    return {
      status: 'running',
      version: '1.0.0',
    };
  }
}
