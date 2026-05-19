import { Module } from '@nestjs/common';
import { SignupService } from './signup.service';
import { SignupController } from './signup.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/superadmin/auth/auth.module';
import { OtpModule } from '@/superadmin/otp/otp.module';

@Module({
  imports: [PrismaModule, AuthModule, OtpModule],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}
