import { Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio | null = null;
  private fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
      this.client = twilio.default(sid, token);
    }
  }

  async sendOTP(phone: string, otp: string): Promise<void> {
    if (!this.client) {
      throw new Error('Twilio credentials not configured');
    }
    await this.client.messages.create({
      body: `Your NeuroLXP verification code is: ${otp}. Valid for 10 minutes.`,
      from: this.fromNumber,
      to: phone.startsWith('+') ? phone : `+91${phone}`,
    });
    this.logger.log(`SMS OTP sent via Twilio to ${phone}`);
  }
}
