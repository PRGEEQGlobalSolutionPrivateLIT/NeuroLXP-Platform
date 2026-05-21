import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MemberAuthService } from './member-auth.service';
import { MemberSigninService } from './member-signin.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    OtpModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION') || '15m' },
      }),
    }),
  ],
  controllers: [MembersController],
  providers: [MembersService, MemberAuthService, MemberSigninService],
  exports: [MembersService, MemberAuthService, MemberSigninService],
})
export class MembersModule {}
