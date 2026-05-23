import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class InstitutionAdminJwtStrategy extends PassportStrategy(Strategy, 'institution-jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: { sub?: string; type?: string }) {
    if (payload.type !== 'institution_access' || !payload.sub) {
      throw new UnauthorizedException();
    }
    const admin = await this.prisma.institutionAdmin.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new UnauthorizedException();
    return { id: admin.id, email: admin.primary_email };
  }
}
