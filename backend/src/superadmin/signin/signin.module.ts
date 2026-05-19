import { Module } from '@nestjs/common';
import { SigninService } from './signin.service';
import { SigninController } from './signin.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';

@Module({
  imports: [PrismaModule, AuthModule, OtpModule],
  controllers: [SigninController],
  providers: [SigninService],
})
export class SigninModule {}
