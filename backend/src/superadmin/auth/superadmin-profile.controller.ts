import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type AuthRequest = { user: { id: string; email: string } };

@Controller('api/auth')
export class SuperadminProfileController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: AuthRequest) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { id: req.user.id },
    });
    if (!admin) return null;

    return {
      id: admin.id,
      fullName: admin.full_name,
      dateOfBirth: admin.date_of_birth.toISOString().slice(0, 10),
      primaryEmail: admin.primary_email,
      primaryPhone: admin.primary_phone,
      alternativeEmail: admin.alternative_email ?? '',
      alternativePhone: admin.alternative_phone ?? '',
      userId: admin.user_id,
      approverName: admin.approver_name ?? '',
      approverDesignation: admin.approver_designation ?? '',
      approverEmail: admin.approver_email ?? '',
      approverPhone: admin.approver_phone ?? '',
      isActive: admin.is_active,
      signupCompleted: admin.signup_completed,
      role: 'Super Admin',
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: AuthRequest,
    @Body()
    body: {
      fullName?: string;
      primaryPhone?: string;
      alternativeEmail?: string;
      alternativePhone?: string;
      approverName?: string;
      approverDesignation?: string;
      approverEmail?: string;
      approverPhone?: string;
    },
  ) {
    const admin = await this.prisma.superAdmin.update({
      where: { id: req.user.id },
      data: {
        ...(body.fullName !== undefined && { full_name: body.fullName.trim() }),
        ...(body.primaryPhone !== undefined && {
          primary_phone: body.primaryPhone.replace(/\s+/g, ''),
        }),
        ...(body.alternativeEmail !== undefined && {
          alternative_email: body.alternativeEmail.trim().toLowerCase() || null,
        }),
        ...(body.alternativePhone !== undefined && {
          alternative_phone: body.alternativePhone.replace(/\s+/g, '') || null,
        }),
        ...(body.approverName !== undefined && { approver_name: body.approverName.trim() || null }),
        ...(body.approverDesignation !== undefined && {
          approver_designation: body.approverDesignation.trim() || null,
        }),
        ...(body.approverEmail !== undefined && {
          approver_email: body.approverEmail.trim().toLowerCase() || null,
        }),
        ...(body.approverPhone !== undefined && {
          approver_phone: body.approverPhone.replace(/\s+/g, '') || null,
        }),
      },
    });

    return {
      id: admin.id,
      fullName: admin.full_name,
      primaryEmail: admin.primary_email,
      primaryPhone: admin.primary_phone,
      alternativeEmail: admin.alternative_email ?? '',
      alternativePhone: admin.alternative_phone ?? '',
      userId: admin.user_id,
      message: 'Profile updated',
    };
  }
}
