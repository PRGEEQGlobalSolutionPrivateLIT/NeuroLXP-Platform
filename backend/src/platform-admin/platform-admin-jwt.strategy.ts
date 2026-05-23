import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PlatformAdminJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: { sub?: string; type?: string }) {
    if (payload.type !== 'platform_access' || !payload.sub) {
      throw new UnauthorizedException();
    }
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new UnauthorizedException();
    return { id: admin.id, email: admin.primary_email };
  }
}
