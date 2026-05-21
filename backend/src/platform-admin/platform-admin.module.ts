import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminSigninService } from './platform-admin-signin.service';
import { PlatformAdminAuthService } from './platform-admin-auth.service';
import { InstitutionAdminModule } from '@/institution-admin/institution-admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OtpModule,
    InstitutionAdminModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '15m' },
      }),
    }),
  ],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService, PlatformAdminSigninService, PlatformAdminAuthService],
  exports: [PlatformAdminService, PlatformAdminSigninService],
})
export class PlatformAdminModule {}
