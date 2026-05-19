import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sgMail = require('@sendgrid/mail') as {
  setApiKey: (key: string) => void;
  send: (msg: Record<string, unknown>) => Promise<unknown>;
};

@Injectable()
export class SendgridService {
  private readonly logger = new Logger(SendgridService.name);
  private configured = false;

  constructor() {
    const key = process.env.SENDGRID_API_KEY;
    if (key && typeof sgMail.setApiKey === 'function') {
      sgMail.setApiKey(key);
      this.configured = true;
    }
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    if (!this.configured) {
      this.logger.warn(`SendGrid not configured — OTP for ${email}: ${otp}`);
      return;
    }
    const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com';
    await sgMail.send({
      to: email,
      from,
      subject: 'NeuroLXP Super Admin — Verification Code',
      html: `
        <h2>Verification Code</h2>
        <p>Your one-time password is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p>
        <p>This code expires in 10 minutes. Do not share it with anyone.</p>
      `,
    });
    this.logger.log(`Email OTP sent via SendGrid to ${email}`);
  }

  async sendApprovalEmail(
    email: string,
    approverName: string,
    approvalCode: string,
  ): Promise<void> {
    if (!this.configured) {
      this.logger.warn(`SendGrid not configured — approval code for ${email}: ${approvalCode}`);
      return;
    }
    const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com';
    await sgMail.send({
      to: email,
      from,
      subject: 'Super Admin Login — Approval Required',
      html: `
        <h2>Approval Required</h2>
        <p>Hello ${approverName},</p>
        <p>A Super Admin login requires your approval.</p>
        <p>Share this code with the admin: <strong>${approvalCode}</strong></p>
        <p>Expires in 1 hour.</p>
      `,
    });
  }
}
