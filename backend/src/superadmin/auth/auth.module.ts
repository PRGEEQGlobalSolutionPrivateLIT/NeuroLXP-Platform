import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './services/password.service';
import { OtpService } from './services/otp.service';
import { AuthenticationService } from './services/authentication.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SuperadminProfileController } from './superadmin-profile.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '15m',
        },
      }),
    }),
  ],
  controllers: [SuperadminProfileController],
  providers: [
    PasswordService,
    OtpService,
    AuthenticationService,
    EmailService,
    SmsService,
    JwtStrategy,
  ],
  exports: [
    PasswordService,
    OtpService,
    AuthenticationService,
    EmailService,
    SmsService,
    PassportModule,
  ],
})
export class AuthModule {}
