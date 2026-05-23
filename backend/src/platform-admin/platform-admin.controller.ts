import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminSigninService } from './platform-admin-signin.service';

@Controller('api/platform-admin')
export class PlatformAdminController {
  constructor(
    private readonly platformAdmin: PlatformAdminService,
    private readonly signin: PlatformAdminSigninService,
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
      createdBySuperAdminId?: string;
    },
  ) {
    return this.platformAdmin.invite(body);
  }

  /** Public self-registration — same flow as invite; magic link emailed to complete onboarding */
  @Post('signup')
  signup(
    @Body()
    body: {
      fullName: string;
      dateOfBirth: string;
      primaryEmail: string;
      primaryPhone: string;
      password: string;
    },
  ) {
    return this.platformAdmin.invite(body);
  }

  @Post('magic-link/consume')
  consumeMagicLink(@Body() body: { token: string; email: string }) {
    return this.platformAdmin.consumeMagicLink(body.token, body.email);
  }

  @Get('onboarding/status/:sessionId')
  onboardingStatus(@Param('sessionId') sessionId: string) {
    return this.platformAdmin.onboardingStatus(sessionId);
  }

  @Post('onboarding/reset-password/:sessionId')
  resetPassword(@Param('sessionId') sessionId: string, @Body() body: { newPassword: string }) {
    return this.platformAdmin.resetPassword(sessionId, body.newPassword);
  }

  @Post('onboarding/totp/setup/:sessionId')
  totpSetup(@Param('sessionId') sessionId: string) {
    return this.platformAdmin.totpSetup(sessionId);
  }

  @Post('onboarding/totp/verify/:sessionId')
  totpVerify(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.platformAdmin.totpVerify(sessionId, body.code);
  }

  @Post('onboarding/alt-contact/:sessionId')
  setAltContact(
    @Param('sessionId') sessionId: string,
    @Body()
    body: { altEmail: string; altPhone: string; emailVerified: boolean; phoneVerified: boolean },
  ) {
    return this.platformAdmin.setAltContact(sessionId, body);
  }

  @Post('onboarding/complete/:sessionId')
  completeOnboarding(@Param('sessionId') sessionId: string) {
    return this.platformAdmin.completeOnboarding(sessionId);
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
    return this.signin.requestSuperAdminApproval(sessionId);
  }

  @Post('signin/approval/check/:sessionId')
  checkApproval(@Param('sessionId') sessionId: string) {
    return this.signin.checkApprovalAndSignin(sessionId);
  }

  @Get('approvals/pending')
  listPendingApprovals() {
    return this.platformAdmin.listPendingApprovals();
  }

  @Post('approvals/:requestId/approve')
  approveRequest(@Param('requestId') requestId: string) {
    return this.platformAdmin.approveRequest(requestId);
  }

  @Get('institution-approvals/pending')
  listInstitutionPendingApprovals() {
    return this.platformAdmin.listInstitutionPendingApprovals();
  }

  @Post('institution-approvals/:requestId/approve')
  approveInstitutionRequest(@Param('requestId') requestId: string) {
    return this.platformAdmin.approveInstitutionRequest(requestId);
  }
}
