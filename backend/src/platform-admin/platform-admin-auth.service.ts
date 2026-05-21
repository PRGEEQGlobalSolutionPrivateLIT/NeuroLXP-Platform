import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PlatformAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createSession(platformAdminId: string) {
    const refreshToken = this.jwtService.sign(
      { sub: platformAdminId, type: 'platform_refresh' },
      { expiresIn: '7d' },
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.platformAdminSession.create({
      data: {
        platform_admin_id: platformAdminId,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      { sub: platformAdminId, type: 'platform_access' },
      { expiresIn: '15m' },
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = this.jwtService.verify(refreshToken) as { sub: string; type: string };
    const session = await this.prisma.platformAdminSession.findUnique({
      where: { refresh_token: refreshToken },
    });
    if (
      !session ||
      session.platform_admin_id !== decoded.sub ||
      new Date() > session.expires_at
    ) {
      throw new BadRequestException('Invalid refresh token');
    }
    return this.jwtService.sign(
      { sub: decoded.sub, type: 'platform_access' },
      { expiresIn: '15m' },
    );
  }
}
