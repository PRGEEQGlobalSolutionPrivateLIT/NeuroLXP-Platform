import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PlatformAdminJwtGuard } from './platform-admin-jwt.guard';

type AuthRequest = { user: { id: string; email: string } };

@Controller('api/platform-admin')
export class PlatformAdminProfileController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  @UseGuards(PlatformAdminJwtGuard)
  async getProfile(@Req() req: AuthRequest) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: req.user.id } });
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
      isActive: admin.is_active,
      onboardingCompleted: admin.onboarding_completed,
      role: 'Platform Admin',
    };
  }

  @Patch('me')
  @UseGuards(PlatformAdminJwtGuard)
  async updateProfile(
    @Req() req: AuthRequest,
    @Body()
    body: {
      fullName?: string;
      primaryPhone?: string;
      alternativeEmail?: string;
      alternativePhone?: string;
    },
  ) {
    const admin = await this.prisma.platformAdmin.update({
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
      },
    });

    return {
      id: admin.id,
      fullName: admin.full_name,
      primaryEmail: admin.primary_email,
      primaryPhone: admin.primary_phone,
      message: 'Profile updated',
    };
  }
}
