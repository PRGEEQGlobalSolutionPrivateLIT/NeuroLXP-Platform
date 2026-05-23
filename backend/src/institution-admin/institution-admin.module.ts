import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';
import { InstitutionAdminController } from './institution-admin.controller';
import { InstitutionAdminProfileController } from './institution-admin-profile.controller';
import { InstitutionAdminService } from './institution-admin.service';
import { InstitutionAdminSigninService } from './institution-admin-signin.service';
import { InstitutionAdminAuthService } from './institution-admin-auth.service';
import { InstitutionAdminJwtStrategy } from './institution-admin-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OtpModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '15m' },
      }),
    }),
  ],
  controllers: [InstitutionAdminController, InstitutionAdminProfileController],
  providers: [
    InstitutionAdminService,
    InstitutionAdminSigninService,
    InstitutionAdminAuthService,
    InstitutionAdminJwtStrategy,
  ],
  exports: [InstitutionAdminService, InstitutionAdminSigninService],
})
export class InstitutionAdminModule {}


