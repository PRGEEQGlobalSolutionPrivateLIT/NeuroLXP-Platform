import { Injectable, Logger } from '@nestjs/common';
import { DevOtpService } from './devotp.service';
import { SendgridService } from './sendgrid.service';
import { TwilioService } from './twilio.service';

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(
    private devOtp: DevOtpService,
    private sendgrid: SendgridService,
    private twilio: TwilioService,
  ) {}

  async sendEmailOTP(email: string, otp: string): Promise<void> {
    if (this.isProduction) {
      await this.sendgrid.sendOTP(email, otp);
    } else {
      await this.devOtp.sendEmailOTP(email, otp);
      this.logger.log('DEV MODE: OTP sent to DevOTP dashboard');
    }
  }

  async sendSMSOTP(phone: string, otp: string): Promise<void> {
    if (this.isProduction) {
      await this.twilio.sendOTP(phone, otp);
    } else {
      await this.devOtp.sendSMSOTP(phone, otp);
      this.logger.log('DEV MODE: OTP sent to DevOTP dashboard');
    }
  }
}
