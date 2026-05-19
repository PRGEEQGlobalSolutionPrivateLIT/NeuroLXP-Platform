import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createAccessToken(superAdminId: string): Promise<string> {
    return this.jwtService.sign(
      { sub: superAdminId, type: 'access' },
      { expiresIn: '15m' },
    );
  }

  async createRefreshToken(superAdminId: string): Promise<string> {
    return this.jwtService.sign(
      { sub: superAdminId, type: 'refresh' },
      { expiresIn: '7d' },
    );
  }

  async createSession(superAdminId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await this.createRefreshToken(superAdminId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        super_admin_id: superAdminId,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
    });

    const accessToken = await this.createAccessToken(superAdminId);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = this.jwtService.verify(refreshToken) as { sub: string };
    const session = await this.prisma.session.findUnique({ where: { refresh_token: refreshToken } });
    if (!session || session.super_admin_id !== decoded.sub || new Date() > session.expires_at) {
      throw new BadRequestException('Invalid refresh token');
    }
    return this.createAccessToken(decoded.sub);
  }

  async invalidateSession(refreshToken: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { refresh_token: refreshToken } });
  }
}
