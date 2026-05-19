import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SignupModule } from './signup/signup.module';
import { SigninModule } from './signin/signin.module';
import { OtpModule } from './otp/otp.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [LoggingModule, AuthModule, OtpModule, SignupModule, SigninModule],
  exports: [AuthModule, OtpModule, SignupModule, SigninModule],
})
export class SuperadminModule {}
