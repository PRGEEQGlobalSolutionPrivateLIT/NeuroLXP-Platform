import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class InstitutionAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createSession(institutionAdminId: string) {
    const refreshToken = this.jwtService.sign(
      { sub: institutionAdminId, type: 'institution_refresh' },
      { expiresIn: '7d' },
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.institutionAdminSession.create({
      data: {
        institution_admin_id: institutionAdminId,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      { sub: institutionAdminId, type: 'institution_access' },
      { expiresIn: '15m' },
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = this.jwtService.verify(refreshToken) as { sub: string; type: string };
    const session = await this.prisma.institutionAdminSession.findUnique({
      where: { refresh_token: refreshToken },
    });
    if (
      !session ||
      session.institution_admin_id !== decoded.sub ||
      new Date() > session.expires_at
    ) {
      throw new BadRequestException('Invalid refresh token');
    }
    return this.jwtService.sign(
      { sub: decoded.sub, type: 'institution_access' },
      { expiresIn: '15m' },
    );
  }
}


