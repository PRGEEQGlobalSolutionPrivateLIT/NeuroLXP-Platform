import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    // Use SendGrid if configured, otherwise fall back to local test SMTP.
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: use test account
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test123456',
        },
      });
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com',
      to: email,
      subject: 'Your NeuroLXP SuperAdmin Login OTP',
      html: `
        <h2>OTP for NeuroLXP SuperAdmin Portal</h2>
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>Do not share this OTP with anyone.</p>
      `,
    });
  }

  async sendApprovalEmail(
    email: string,
    approverName: string,
    approvalCode: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com',
      to: email,
      subject: 'Secondary Approver Authorization Required',
      html: `
        <h2>Login Approval Required</h2>
        <p>Hello ${approverName},</p>
        <p>A SuperAdmin login attempt requires your approval.</p>
        <p>Approval Code: <strong>${approvalCode}</strong></p>
        <p>This code will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  async sendSignupConfirmation(email: string, fullName: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com',
      to: email,
      subject: 'SuperAdmin Account Created Successfully',
      html: `
        <h2>Welcome to NeuroLXP SuperAdmin Portal</h2>
        <p>Hello ${fullName},</p>
        <p>Your SuperAdmin account has been created successfully.</p>
        <p>You can now login using your credentials.</p>
        <p>Secure your account immediately after first login.</p>
      `,
    });
  }

  async sendRecoveryCodeEmail(email: string, recoveryCode: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@neurolxp.com',
      to: email,
      subject: 'Your New Recovery Code',
      html: `
        <h2>New Recovery Code Generated</h2>
        <p>A new recovery code has been generated for your account:</p>
        <p><strong>${recoveryCode}</strong></p>
        <p>Keep this code safe. You can use it to recover your account if you lose access.</p>
      `,
    });
  }
}
