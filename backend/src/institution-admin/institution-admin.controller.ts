import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InstitutionAdminService } from './institution-admin.service';
import { InstitutionAdminSigninService } from './institution-admin-signin.service';

@Controller('api/institution-admin')
export class InstitutionAdminController {
  constructor(
    private readonly institutionAdminService: InstitutionAdminService,
    private readonly signin: InstitutionAdminSigninService,
  ) {}

  @Post('invite')
  invite(
    @Body()
    body: {
      fullName: string;
      dateOfBirth: string;
      primaryEmail: string;
      primaryPhone: string;
      password: string;
      createdByPlatformAdminId?: string;
    },
  ) {
    return this.institutionAdminService.invite(body);
  }

  @Post('magic-link/consume')
  consumeMagicLink(@Body() body: { token: string; email: string }) {
    return this.institutionAdminService.consumeMagicLink(body.token, body.email);
  }

  @Get('onboarding/status/:sessionId')
  onboardingStatus(@Param('sessionId') sessionId: string) {
    return this.institutionAdminService.onboardingStatus(sessionId);
  }

  @Post('onboarding/reset-password/:sessionId')
  resetPassword(@Param('sessionId') sessionId: string, @Body() body: { newPassword: string }) {
    return this.institutionAdminService.resetPassword(sessionId, body.newPassword);
  }

  @Post('onboarding/totp/setup/:sessionId')
  totpSetup(@Param('sessionId') sessionId: string) {
    return this.institutionAdminService.totpSetup(sessionId);
  }

  @Post('onboarding/totp/verify/:sessionId')
  totpVerify(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.institutionAdminService.totpVerify(sessionId, body.code);
  }

  @Post('onboarding/alt-contact/:sessionId')
  setAltContact(
    @Param('sessionId') sessionId: string,
    @Body()
    body: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) {
    return this.institutionAdminService.setAltContact(sessionId, body);
  }

  @Post('onboarding/complete/:sessionId')
  completeOnboarding(@Param('sessionId') sessionId: string) {
    return this.institutionAdminService.completeOnboarding(sessionId);
  }

  @Post('signin/primary')
  primarySignin(@Body() body: { identifier: string; password: string }) {
    return this.signin.primarySignin(body.identifier, body.password);
  }

  @Post('signin/otp/send/:sessionId')
  sendOtp(
    @Param('sessionId') sessionId: string,
    @Body() body: { method: 'email' | 'phone'; channel: 'primary' | 'alt' },
  ) {
    return body.channel === 'primary'
      ? this.signin.sendPrimaryOtp(sessionId, body.method)
      : this.signin.sendAltOtp(sessionId, body.method);
  }

  @Post('signin/otp/verify/:sessionId')
  verifyOtp(
    @Param('sessionId') sessionId: string,
    @Body() body: { method: 'email' | 'phone'; otp: string; channel: 'primary' | 'alt' },
  ) {
    return body.channel === 'primary'
      ? this.signin.verifyPrimaryOtp(sessionId, body.method, body.otp)
      : this.signin.verifyAltOtp(sessionId, body.method, body.otp);
  }

  @Post('signin/totp/:sessionId')
  totp(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signin.verifyTotp(sessionId, body.code);
  }

  @Post('signin/recovery/:sessionId')
  recovery(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signin.verifyRecovery(sessionId, body.code);
  }

  @Post('signin/approval/request/:sessionId')
  requestApproval(@Param('sessionId') sessionId: string) {
    return this.signin.requestPlatformAdminApproval(sessionId);
  }

  @Post('signin/approval/check/:sessionId')
  checkApproval(@Param('sessionId') sessionId: string) {
    return this.signin.checkApprovalAndSignin(sessionId);
  }

  @Get('approvals/pending')
  listPendingApprovals() {
    return this.institutionAdminService.listPendingApprovals();
  }

  @Post('approvals/:requestId/approve')
  approveRequest(@Param('requestId') requestId: string) {
    return this.institutionAdminService.approveRequest(requestId);
  }
}


