import { Controller, Post, Body } from '@nestjs/common';
import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { OtpStoreService } from './otp-store.service';

class SendOtpDto {
  @IsString()
  identifier!: string;

  @IsIn(['email', 'sms', 'phone'])
  type!: 'email' | 'sms' | 'phone';
}

class VerifyOtpDto {
  @IsString()
  identifier!: string;

  @IsIn(['email', 'sms', 'phone'])
  type!: 'email' | 'sms' | 'phone';

  @IsString()
  @Length(6, 6)
  otp!: string;
}

@Controller('api/otp')
export class OtpController {
  constructor(private otpStore: OtpStoreService) {}

  @Post('send')
  send(@Body() dto: SendOtpDto) {
    return this.otpStore.sendOtp(dto.identifier, dto.type);
  }

  @Post('verify')
  async verify(@Body() dto: VerifyOtpDto) {
    const valid = await this.otpStore.verifyOtp(dto.identifier, dto.type, dto.otp);
    return { verified: valid };
  }
}
