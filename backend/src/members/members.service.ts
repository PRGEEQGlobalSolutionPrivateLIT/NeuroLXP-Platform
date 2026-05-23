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
    tenantId?: string;
    tenantName?: string;
  }) {
    const result = await this.createMemberInvite({
      role: dto.role,
      fullName: dto.fullName,
      email: dto.email,
      phone: undefined,
      department: undefined,
      employeeId: undefined,
      extra: {},
      createdByType: dto.createdByType,
      createdById: dto.createdById,
    });

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      memberId: result.memberId,
      email: result.email,
      userId: result.userId,
      magicLinkSent: true,
      ...(isDev && { devMagicLink: result.magicLink, tempPassword: result.tempPassword }),
    };
  }

  async bulkInvite(dto: {
    role: LxpMemberRole;
    rows: CsvRowInput[];
    createdByType?: string;
    createdById?: string;
    fileName?: string;
    tenantId?: string;
    tenantName?: string;
  }) {
    const { rows: validated, canUpload } = this.validateCsvRows(dto.role, dto.rows);
    if (!canUpload) {
      throw new BadRequestException('Fix all row errors before uploading');
    }

    const upload = await this.prisma.memberBulkUpload.create({
      data: {
        role: dto.role,
        uploaded_by_type: dto.createdByType ?? 'unknown',
        uploaded_by_id: dto.createdById ?? null,
        tenant_id: dto.tenantId ?? null,
        tenant_name: dto.tenantName ?? null,
        file_name: dto.fileName ?? null,
        total_rows: validated.length,
      },
    });

    const results: {
      rowIndex: number;
      email: string;
      success: boolean;
      error?: string;
      userId?: string;
      tempPassword?: string;
      magicLink?: string;
      reinvited?: boolean;
    }[] = [];
    const credentials: {
      rowIndex: number;
      fullName: string;
      email: string;
      userId: string;
      tempPassword: string;
      magicLink: string;
      memberId: string;
    }[] = [];

    for (const row of validated) {
      try {
        const invited = await this.createMemberInvite(
          {
            role: dto.role,
            fullName: row.fullName,
            email: row.email,
            phone: row.phone,
            department: row.department,
            employeeId: row.employeeId,
            extra: row.extra ?? {},
            tenantId: dto.tenantId,
            tenantName: dto.tenantName,
            createdByType: dto.createdByType,
            createdById: dto.createdById,
          },
          { reinviteIfExists: true },
        );

        await this.prisma.memberBulkUploadCredential.create({
          data: {
            bulk_upload_id: upload.id,
            member_id: invited.memberId,
            row_index: row.rowIndex,
            full_name: row.fullName,
            email: row.email,
            user_id: invited.userId,
            temp_password: invited.tempPassword,
            magic_link: invited.magicLink,
            email_sent: true,
          },
        });

        credentials.push({
          rowIndex: row.rowIndex,
          fullName: row.fullName,
          email: row.email,
          userId: invited.userId,
          tempPassword: invited.tempPassword,
          magicLink: invited.magicLink,
          memberId: invited.memberId,
        });

        results.push({
          rowIndex: row.rowIndex,
          email: row.email,
          success: true,
          userId: invited.userId,
          tempPassword: invited.tempPassword,
          magicLink: invited.magicLink,
          reinvited: invited.reinvited,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed';
        results.push({ rowIndex: row.rowIndex, email: row.email, success: false, error: msg });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await this.prisma.memberBulkUpload.update({
      where: { id: upload.id },
      data: { succeeded, failed },
    });

    return {
      bulkUploadId: upload.id,
      total: results.length,
      succeeded,
      failed,
      results,
      credentials,
    };
  }

  listRecentBulkUploads(uploadedByType?: string, limit = 20) {
    return this.prisma.memberBulkUpload.findMany({
      where: uploadedByType ? { uploaded_by_type: uploadedByType } : undefined,
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        tenant_name: true,
        file_name: true,
        total_rows: true,
        succeeded: true,
        failed: true,
        created_at: true,
      },
    });
  }

  async getLatestBulkUploadCredentials(uploadedByType?: string) {
    const upload = await this.prisma.memberBulkUpload.findFirst({
      where: uploadedByType ? { uploaded_by_type: uploadedByType } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        credentials: { orderBy: { row_index: 'asc' } },
      },
    });
    if (!upload) throw new BadRequestException('No bulk uploads found');
    return this.mapBulkUploadCredentials(upload);
  }

  async getBulkUploadCredentials(bulkUploadId: string) {
    const upload = await this.prisma.memberBulkUpload.findUnique({
      where: { id: bulkUploadId },
      include: {
        credentials: { orderBy: { row_index: 'asc' } },
      },
    });
    if (!upload) throw new BadRequestException('Bulk upload not found');

    return this.mapBulkUploadCredentials(upload);
  }

  private mapBulkUploadCredentials(upload: {
    id: string;
    role: LxpMemberRole;
    tenant_id: string | null;
    tenant_name: string | null;
    file_name: string | null;
    total_rows: number;
    succeeded: number;
    failed: number;
    created_at: Date;
    credentials: {
      id: string;
      row_index: number;
      full_name: string;
      email: string;
      user_id: string | null;
      temp_password: string;
      magic_link: string;
      email_sent: boolean;
    }[];
  }) {
    return {
      id: upload.id,
      role: upload.role,
      tenantId: upload.tenant_id,
      tenantName: upload.tenant_name,
      fileName: upload.file_name,
      totalRows: upload.total_rows,
      succeeded: upload.succeeded,
      failed: upload.failed,
      createdAt: upload.created_at,
      credentials: upload.credentials.map((c) => ({
        id: c.id,
        rowIndex: c.row_index,
        fullName: c.full_name,
        email: c.email,
        userId: c.user_id,
        tempPassword: c.temp_password,
        magicLink: c.magic_link,
        emailSent: c.email_sent,
      })),
    };
  }

  private async createMemberInvite(
    dto: {
      role: LxpMemberRole;
      fullName: string;
      email: string;
      phone?: string;
      department?: string;
      employeeId?: string;
      extra?: Record<string, string>;
      tenantId?: string;
      tenantName?: string;
      createdByType?: string;
      createdById?: string;
    },
    options?: { reinviteIfExists?: boolean },
  ) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.lxpMember.findUnique({
      where: { email_role: { email, role: dto.role } },
    });
    if (existing) {
      if (options?.reinviteIfExists) {
        return this.reinviteExistingMember(existing, dto);
      }
      throw new BadRequestException('Member with this email and role already exists');
    }

    const tempPassword = this.generateTempPassword();
    const passwordHash = await this.passwordService.hashPassword(tempPassword);
    const userId = this.otpService.generateUserId(dto.fullName.trim());
    const { magicToken, magicHash, magicExpires } = await this.createMagicTokens();

    const extra = this.buildMemberExtra(dto);

    const member = await this.prisma.lxpMember.create({
      data: {
        role: dto.role,
        full_name: dto.fullName.trim(),
        email,
        phone: dto.phone?.trim() || null,
        department: dto.department?.trim() || null,
        employee_id: dto.employeeId?.trim() || null,
        user_id: userId,
        extra_data: extra as Prisma.InputJsonValue,
        password_hash: passwordHash,
        magic_link_token_hash: magicHash,
        magic_link_expires_at: magicExpires,
        must_change_password: true,
        created_by_type: dto.createdByType,
        created_by_id: dto.createdById,
      },
    });

    const magicLink = this.buildMagicLink(magicToken, email, dto.role);
    await this.sendWelcomeEmail(email, dto.fullName, dto.role, tempPassword, magicLink, userId);

    return {
      memberId: member.id,
      email,
      userId,
      tempPassword,
      magicLink,
      reinvited: false,
    };
  }

  private async reinviteExistingMember(
    existing: {
      id: string;
      email: string;
      role: LxpMemberRole;
      full_name: string;
      user_id: string | null;
      extra_data: unknown;
    },
    dto: {
      role: LxpMemberRole;
      fullName: string;
      email: string;
      phone?: string;
      department?: string;
      employeeId?: string;
      extra?: Record<string, string>;
      tenantId?: string;
      tenantName?: string;
    },
  ) {
    const email = dto.email.trim().toLowerCase();
    const tempPassword = this.generateTempPassword();
    const passwordHash = await this.passwordService.hashPassword(tempPassword);
    const { magicToken, magicHash, magicExpires } = await this.createMagicTokens();

    const prior =
      typeof existing.extra_data === 'object' && existing.extra_data !== null
        ? (existing.extra_data as Record<string, unknown>)
        : {};
    const priorSupplement = prior.student_supplement;
    const extra = this.buildMemberExtra(dto);
    if (priorSupplement) {
      extra.student_supplement = priorSupplement;
    }

    const userId = existing.user_id ?? this.otpService.generateUserId(dto.fullName.trim());

    await this.prisma.lxpMember.update({
      where: { id: existing.id },
      data: {
        full_name: dto.fullName.trim(),
        phone: dto.phone?.trim() || undefined,
        department: dto.department?.trim() || undefined,
        employee_id: dto.employeeId?.trim() || undefined,
        user_id: userId,
        extra_data: extra as Prisma.InputJsonValue,
        password_hash: passwordHash,
        magic_link_token_hash: magicHash,
        magic_link_expires_at: magicExpires,
        must_change_password: true,
      },
    });

    const magicLink = this.buildMagicLink(magicToken, email, dto.role);
    await this.sendWelcomeEmail(email, dto.fullName, dto.role, tempPassword, magicLink, userId);

    return {
      memberId: existing.id,
      email,
      userId,
      tempPassword,
      magicLink,
      reinvited: true,
    };
  }

  private buildMemberExtra(dto: {
    department?: string;
    employeeId?: string;
    extra?: Record<string, string>;
    tenantId?: string;
    tenantName?: string;
  }) {
    const extra: Record<string, unknown> = { ...(dto.extra ?? {}) };
    if (dto.department) extra.department = dto.department;
    if (dto.employeeId) extra.employee_id = dto.employeeId;
    if (dto.tenantId) extra.tenant_id = dto.tenantId;
    if (dto.tenantName) extra.tenant_name = dto.tenantName;
    if (!extra.student_supplement) {
      extra.student_supplement = {
        feature_goal: '',
        attended_hackathon: 'no',
        hackathon_title: '',
        hackathon_team_size: '',
        won_prize: 'no',
        prize_place: '',
        cash_prize: '',
        project_title: '',
      };
    }
    return extra;
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
    userId?: string,
  ) {
    const roleName = this.roleLabel(role);
    const body = [
      `Hello ${fullName},`,
      ``,
      `Your account has been created at NeuroLXP as a ${roleName}.`,
      ``,
      `Credentials to access your account:`,
      `User ID: ${userId ?? '(assigned at first login)'}`,
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
