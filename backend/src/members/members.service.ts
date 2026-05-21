import { BadRequestException, Injectable } from '@nestjs/common';
import { LxpMemberRole, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PasswordService } from '@/superadmin/auth/services/password.service';
import { OtpService } from '@/superadmin/auth/services/otp.service';
import { OtpDeliveryService } from '@/superadmin/otp/otp-delivery.service';
import { randomBytes } from 'crypto';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export type CsvRowInput = {
  rowIndex: number;
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  employeeId?: string;
  extra?: Record<string, string>;
};

export type CsvRowValidation = CsvRowInput & {
  errors: string[];
  warnings: string[];
  valid: boolean;
};

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private otpService: OtpService,
    private delivery: OtpDeliveryService,
  ) {}

  validateCsvRows(role: LxpMemberRole, rows: CsvRowInput[]): { rows: CsvRowValidation[]; canUpload: boolean } {
    const emailsSeen = new Set<string>();
    const validated = rows.map((row) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const name = row.fullName?.trim() ?? '';
      const email = row.email?.trim().toLowerCase() ?? '';
      const phone = row.phone?.trim() ?? '';

      if (!name) errors.push('Name is required');
      if (!email) errors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
      if (!phone) errors.push('Phone number is required');

      if (email) {
        if (emailsSeen.has(email)) errors.push('Duplicate email in CSV');
        emailsSeen.add(email);
      }

      const optionalFields: { label: string; value?: string }[] = [
        { label: 'department', value: row.department },
        { label: 'employee_id', value: row.employeeId },
      ];
      for (const f of optionalFields) {
        if (f.value !== undefined && f.value !== null && String(f.value).trim() === '') {
          warnings.push(`${f.label} is blank — use NA if not applicable`);
        }
      }
      if (row.extra) {
        for (const [key, val] of Object.entries(row.extra)) {
          if (val !== undefined && val !== null && String(val).trim() === '') {
            warnings.push(`Column "${key}" is blank — use NA if not applicable`);
          }
        }
      }

      return {
        ...row,
        fullName: name,
        email,
        phone,
        errors,
        warnings,
        valid: errors.length === 0,
      };
    });

    const canUpload = validated.length > 0 && validated.every((r) => r.valid);
    return { rows: validated, canUpload };
  }

  async inviteSingle(dto: {
    role: LxpMemberRole;
    fullName: string;
    email: string;
    createdByType?: string;
    createdById?: string;
  }) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.lxpMember.findUnique({
      where: { email_role: { email, role: dto.role } },
    });
    if (existing) throw new BadRequestException('Member with this email and role already exists');

    const tempPassword = this.generateTempPassword();
    const passwordHash = await this.passwordService.hashPassword(tempPassword);
    const { magicToken, magicHash, magicExpires } = await this.createMagicTokens();

    const member = await this.prisma.lxpMember.create({
      data: {
        role: dto.role,
        full_name: dto.fullName.trim(),
        email,
        password_hash: passwordHash,
        magic_link_token_hash: magicHash,
        magic_link_expires_at: magicExpires,
        must_change_password: true,
        created_by_type: dto.createdByType,
        created_by_id: dto.createdById,
      },
    });

    const magicLink = this.buildMagicLink(magicToken, email, dto.role);
    await this.sendWelcomeEmail(email, dto.fullName, dto.role, tempPassword, magicLink);

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      memberId: member.id,
      email,
      magicLinkSent: true,
      ...(isDev && { devMagicLink: magicLink, tempPassword }),
    };
  }

  async bulkInvite(dto: {
    role: LxpMemberRole;
    rows: CsvRowInput[];
    createdByType?: string;
    createdById?: string;
  }) {
    const { rows: validated, canUpload } = this.validateCsvRows(dto.role, dto.rows);
    if (!canUpload) {
      throw new BadRequestException('Fix all row errors before uploading');
    }

    const results: { rowIndex: number; email: string; success: boolean; error?: string }[] = [];

    for (const row of validated) {
      try {
        const tempPassword = this.generateTempPassword();
        const passwordHash = await this.passwordService.hashPassword(tempPassword);
        const { magicToken, magicHash, magicExpires } = await this.createMagicTokens();

        const extra = { ...(row.extra ?? {}) };
        if (row.department) extra.department = row.department;
        if (row.employeeId) extra.employee_id = row.employeeId;

        await this.prisma.lxpMember.create({
          data: {
            role: dto.role,
            full_name: row.fullName,
            email: row.email,
            phone: row.phone,
            department: row.department?.trim() || null,
            employee_id: row.employeeId?.trim() || null,
            extra_data: extra as Prisma.InputJsonValue,
            password_hash: passwordHash,
            magic_link_token_hash: magicHash,
            magic_link_expires_at: magicExpires,
            must_change_password: true,
            created_by_type: dto.createdByType,
            created_by_id: dto.createdById,
          },
        });

        const magicLink = this.buildMagicLink(magicToken, row.email, dto.role);
        await this.sendWelcomeEmail(row.email, row.fullName, dto.role, tempPassword, magicLink);
        results.push({ rowIndex: row.rowIndex, email: row.email, success: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed';
        results.push({ rowIndex: row.rowIndex, email: row.email, success: false, error: msg });
      }
    }

    return {
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  private generateTempPassword() {
    return randomBytes(4).toString('hex') + 'A1!';
  }

  private async createMagicTokens() {
    const magicToken = randomBytes(32).toString('hex');
    const magicHash = await this.passwordService.hashPassword(magicToken);
    const magicExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return { magicToken, magicHash, magicExpires };
  }

  private buildMagicLink(token: string, email: string, role: LxpMemberRole) {
    return `${FRONTEND_URL}/member/${role}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`;
  }

  private roleLabel(role: LxpMemberRole) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  private async sendWelcomeEmail(
    email: string,
    fullName: string,
    role: LxpMemberRole,
    tempPassword: string,
    magicLink: string,
  ) {
    const roleName = this.roleLabel(role);
    const body = [
      `Hello ${fullName},`,
      ``,
      `Your account has been created at NeuroLXP as a ${roleName}.`,
      ``,
      `Credentials to access your account:`,
      `Email: ${email}`,
      `Temporary password: ${tempPassword}`,
      ``,
      `Sign-in link: ${magicLink}`,
      ``,
      `Important: After logging in, you must change your password and update your profile.`,
      ``,
      `— NeuroLXP Team`,
    ].join('\n');

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.log(`[Member invite ${role}] ${email}:\n${body}`);

    await this.delivery.sendEmailOTP(email, body.slice(0, 500));
  }
}
