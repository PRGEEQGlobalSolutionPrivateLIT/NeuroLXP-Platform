import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { SignupService } from './signup.service';

@Controller('api/auth/signup')
export class SignupController {
  constructor(private signupService: SignupService) {}

  @Post('initialize')
  initialize() {
    return this.signupService.initializeSignup();
  }

  @Get('progress/:sessionId')
  progress(@Param('sessionId') sessionId: string) {
    return this.signupService.getProgress(sessionId);
  }

  @Post('step1/:sessionId')
  step1(
    @Param('sessionId') sessionId: string,
    @Body() body: { fullName: string; dateOfBirth: string },
  ) {
    return this.signupService.saveStep1(sessionId, body.fullName, body.dateOfBirth);
  }

  @Post('send-otp/:sessionId')
  sendOtp(
    @Param('sessionId') sessionId: string,
    @Body() body: { identifier: string; type: 'email' | 'sms' | 'phone' },
  ) {
    return this.signupService.sendOtp(sessionId, body.identifier, body.type);
  }

  @Post('verify-otp/:sessionId')
  verifyOtp(
    @Param('sessionId') sessionId: string,
    @Body() body: { identifier: string; type: 'email' | 'sms' | 'phone'; otp: string; field: string },
  ) {
    return this.signupService.verifyOtp(sessionId, body.identifier, body.type, body.otp, body.field);
  }

  @Post('step2/:sessionId')
  step2(
    @Param('sessionId') sessionId: string,
    @Body() body: { primaryEmail: string; primaryPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) {
    return this.signupService.saveStep2Contact(sessionId, body.primaryEmail, body.primaryPhone, body.emailVerified, body.phoneVerified);
  }

  @Post('password/:sessionId')
  password(@Param('sessionId') sessionId: string, @Body() body: { password: string }) {
    return this.signupService.savePassword(sessionId, body.password);
  }

  @Post('user-id/:sessionId')
  userId(@Param('sessionId') sessionId: string) {
    return this.signupService.generateUserId(sessionId);
  }

  @Post('alt-contact/:sessionId')
  altContact(
    @Param('sessionId') sessionId: string,
    @Body() body: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) {
    return this.signupService.saveAltContact(sessionId, body.altEmail, body.altPhone, body.emailVerified, body.phoneVerified);
  }

  @Post('totp/setup/:sessionId')
  totpSetup(@Param('sessionId') sessionId: string) {
    return this.signupService.setupTotp(sessionId);
  }

  @Post('totp/verify/:sessionId')
  totpVerify(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signupService.verifyTotp(sessionId, body.code);
  }

  @Post('recovery-code/:sessionId')
  recoveryCode(@Param('sessionId') sessionId: string) {
    return this.signupService.generateRecoveryCode(sessionId);
  }

  @Post('security-codes/:sessionId')
  securityCodes(@Param('sessionId') sessionId: string) {
    return this.signupService.generateSecurityCodes(sessionId);
  }

  @Post('identity/:sessionId')
  identity(
    @Param('sessionId') sessionId: string,
    @Body() body: { selfieBase64: string; govtIdType: string; govtIdNumber: string },
  ) {
    return this.signupService.saveIdentity(sessionId, body.selfieBase64, body.govtIdType, body.govtIdNumber);
  }

  @Post('security-qa/:sessionId')
  securityQA(@Param('sessionId') sessionId: string, @Body() body: Record<string, string>) {
    return this.signupService.saveSecurityQA(sessionId, body as Parameters<SignupService['saveSecurityQA']>[1]);
  }

  @Post('declarations/:sessionId')
  declarations(@Param('sessionId') sessionId: string, @Body() body: { declarations: Record<string, boolean> }) {
    return this.signupService.saveDeclarations(sessionId, body.declarations);
  }

  @Get('review/:sessionId')
  review(@Param('sessionId') sessionId: string) {
    return this.signupService.getReview(sessionId);
  }

  @Post('complete/:sessionId')
  complete(@Param('sessionId') sessionId: string) {
    return this.signupService.completeSignup(sessionId);
  }

  @Delete('cancel/:sessionId')
  cancel(@Param('sessionId') sessionId: string) {
    return this.signupService.cancelSignup(sessionId);
  }
}
