import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SigninService } from './signin.service';

@Controller('api/auth/signin')
export class SigninController {
  constructor(private signinService: SigninService) {}

  @Post('primary')
  primary(@Body() body: { identifier: string; password: string }) {
    return this.signinService.primarySignin(body.identifier, body.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { identifier: string; newPassword: string; otp: string }) {
    return this.signinService.forgotPassword(body.identifier, body.newPassword, body.otp);
  }

  @Post('otp/send/:sessionId')
  sendOtp(@Param('sessionId') sessionId: string, @Body() body: { method: 'email' | 'phone'; channel: 'primary' | 'alt' }) {
    return body.channel === 'primary'
      ? this.signinService.sendPrimaryOtp(sessionId, body.method)
      : this.signinService.sendAltOtp(sessionId, body.method);
  }

  @Post('otp/verify/:sessionId')
  verifyOtp(
    @Param('sessionId') sessionId: string,
    @Body() body: { method: 'email' | 'phone'; otp: string; channel: 'primary' | 'alt' },
  ) {
    return body.channel === 'primary'
      ? this.signinService.verifyPrimaryOtp(sessionId, body.method, body.otp)
      : this.signinService.verifyAltOtp(sessionId, body.method, body.otp);
  }

  @Post('totp/:sessionId')
  totp(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signinService.verifyTotp(sessionId, body.code);
  }

  @Post('recovery/:sessionId')
  recovery(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signinService.verifyRecoveryCode(sessionId, body.code);
  }

  @Post('recovery/ack/:sessionId')
  recoveryAck(@Param('sessionId') sessionId: string) {
    return this.signinService.acknowledgeRecoveryAndSignin(sessionId);
  }

  @Post('security-code/:sessionId')
  securityCode(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signinService.verifySecurityCode(sessionId, body.code);
  }

  @Post('govt-id/:sessionId')
  govtId(@Param('sessionId') sessionId: string, @Body() body: { idNumber: string }) {
    return this.signinService.verifyGovtId(sessionId, body.idNumber);
  }

  @Get('security-questions/:superAdminId')
  securityQuestions(@Param('superAdminId') superAdminId: string) {
    return this.signinService.getSecurityQuestions(superAdminId);
  }

  @Post('security-questions/:sessionId')
  verifySecurityQuestions(
    @Param('sessionId') sessionId: string,
    @Body() body: { a1: string; a2: string; a3: string },
  ) {
    return this.signinService.verifySecurityQuestions(sessionId, body);
  }

  @Post('approval/request/:sessionId')
  requestApproval(@Param('sessionId') sessionId: string) {
    return this.signinService.requestApproval(sessionId);
  }

  @Post('approval/verify/:sessionId')
  verifyApproval(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signinService.verifyApproval(sessionId, body.code);
  }
}
