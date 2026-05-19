import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DevOtpService {
  private readonly logger = new Logger(DevOtpService.name);
  private readonly baseUrl = process.env.DEVOTP_BASE_URL || 'https://api.devotp.com';
  private readonly apiKey = process.env.DEVOTP_API_KEY || '';

  async sendEmailOTP(email: string, otp: string): Promise<void> {
    await this.send('email', email, otp);
    this.logger.log(`DEV MODE: Email OTP sent to DevOTP dashboard for ${email}`);
  }

  async sendSMSOTP(phone: string, otp: string): Promise<void> {
    await this.send('sms', phone, otp);
    this.logger.log(`DEV MODE: SMS OTP sent to DevOTP dashboard for ${phone}`);
  }

  private async send(channel: 'email' | 'sms', to: string, otp: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`DEVOTP_API_KEY not set — OTP for ${to}: ${otp}`);
      return;
    }

    try {
      await axios.post(
        `${this.baseUrl}/v1/send`,
        {
          channel,
          to,
          message: `Your NeuroLXP verification code is: ${otp}`,
          code: otp,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (err) {
      this.logger.warn(`DevOTP API unavailable — OTP for ${to}: ${otp}`);
    }
  }
}
