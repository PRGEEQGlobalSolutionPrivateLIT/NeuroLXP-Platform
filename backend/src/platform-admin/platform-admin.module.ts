import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';
import { PassportModule } from '@nestjs/passport';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminProfileController } from './platform-admin-profile.controller';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminSigninService } from './platform-admin-signin.service';
import { PlatformAdminAuthService } from './platform-admin-auth.service';
import { PlatformAdminJwtStrategy } from './platform-admin-jwt.strategy';
import { InstitutionAdminModule } from '@/institution-admin/institution-admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OtpModule,
    InstitutionAdminModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '15m' },
      }),
    }),
  ],
  controllers: [PlatformAdminController, PlatformAdminProfileController],
  providers: [
    PlatformAdminService,
    PlatformAdminSigninService,
    PlatformAdminAuthService,
    PlatformAdminJwtStrategy,
  ],
  exports: [PlatformAdminService, PlatformAdminSigninService],
})
export class PlatformAdminModule {}
