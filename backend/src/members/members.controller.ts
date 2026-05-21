import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LxpMemberRole } from '@prisma/client';
import { MembersService, CsvRowInput } from './members.service';
import { MemberAuthService } from './member-auth.service';
import { MemberSigninService } from './member-signin.service';

@Controller('api/members')
export class MembersController {
  constructor(
    private members: MembersService,
    private auth: MemberAuthService,
    private signin: MemberSigninService,
  ) {}

  @Post('validate-csv')
  validateCsv(@Body() body: { role: LxpMemberRole; rows: CsvRowInput[] }) {
    return this.members.validateCsvRows(body.role, body.rows);
  }

  @Post('invite/single')
  singleInvite(
    @Body()
    body: {
      role: LxpMemberRole;
      fullName: string;
      email: string;
      createdByType?: string;
      createdById?: string;
    },
  ) {
    return this.members.inviteSingle(body);
  }

  @Post('invite/bulk')
  bulkInvite(
    @Body()
    body: {
      role: LxpMemberRole;
      rows: CsvRowInput[];
      createdByType?: string;
      createdById?: string;
    },
  ) {
    return this.members.bulkInvite(body);
  }

  @Post('magic-link/consume')
  consumeMagic(@Body() body: { token: string; email: string; role: LxpMemberRole }) {
    return this.auth.consumeMagicLink(body.token, body.email, body.role);
  }

  @Post('signin/primary')
  primarySignin(
    @Body() body: { identifier?: string; email?: string; password: string; role: LxpMemberRole },
  ) {
    const identifier = (body.identifier ?? body.email ?? '').trim();
    return this.signin.primarySignin(identifier, body.password, body.role);
  }

  @Post('signin/totp/:sessionId')
  totpSignin(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signin.verifyTotpSignin(sessionId, body.code);
  }

  @Post('signin/recovery/:sessionId')
  recoverySignin(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.signin.verifyRecoverySignin(sessionId, body.code);
  }

  @Post('signin/approval/request/:sessionId')
  requestApproval(@Param('sessionId') sessionId: string) {
    return this.signin.requestUpperLevelApproval(sessionId);
  }

  @Post('signin/approval/check/:sessionId')
  checkApproval(@Param('sessionId') sessionId: string) {
    return this.signin.checkUpperLevelApproval(sessionId);
  }

  @Get('approvals/pending')
  listApprovals(@Query('approverRole') approverRole: 'coordinator' | 'institution_admin') {
    return this.signin.listPendingApprovals(approverRole);
  }

  @Post('approvals/:requestId/approve')
  approveMember(@Param('requestId') requestId: string) {
    return this.signin.approveMemberRequest(requestId);
  }

  @Post('forgot-password/start')
  forgotStart(@Body() body: { identifier?: string; email?: string; role: LxpMemberRole }) {
    const identifier = (body.identifier ?? body.email ?? '').trim();
    return this.signin.startForgotPassword(identifier, body.role);
  }

  @Post('forgot-password/set/:sessionId')
  forgotSetPassword(
    @Param('sessionId') sessionId: string,
    @Body() body: { newPassword: string; confirmPassword: string },
  ) {
    return this.signin.setForgotPassword(sessionId, body.newPassword, body.confirmPassword);
  }

  @Post('forgot-password/otp/send/:sessionId')
  forgotSendOtp(@Param('sessionId') sessionId: string) {
    return this.signin.sendForgotOtp(sessionId);
  }

  @Post('forgot-password/otp/verify/:sessionId')
  forgotVerifyOtp(@Param('sessionId') sessionId: string, @Body() body: { otp: string }) {
    return this.signin.verifyForgotOtp(sessionId, body.otp);
  }

  @Post('onboarding/password/:sessionId')
  onboardingPassword(
    @Param('sessionId') sessionId: string,
    @Body() body: { newPassword: string; confirmPassword: string },
  ) {
    return this.auth.setOnboardingPassword(sessionId, body.newPassword, body.confirmPassword);
  }

  @Post('onboarding/totp/setup/:sessionId')
  onboardingTotpSetup(@Param('sessionId') sessionId: string) {
    return this.auth.totpSetup(sessionId);
  }

  @Post('onboarding/totp/verify/:sessionId')
  onboardingTotpVerify(@Param('sessionId') sessionId: string, @Body() body: { code: string }) {
    return this.auth.totpVerifyOnboarding(sessionId, body.code);
  }

  @Post('onboarding/complete/:sessionId')
  onboardingComplete(@Param('sessionId') sessionId: string) {
    return this.auth.completeOnboarding(sessionId);
  }

  @Post('change-password/:memberId')
  changePassword(@Param('memberId') memberId: string, @Body() body: { newPassword: string }) {
    return this.auth.changePassword(memberId, body.newPassword);
  }

  @Get('profile/:memberId')
  profile(@Param('memberId') memberId: string) {
    return this.auth.getProfile(memberId);
  }

  @Post('profile/:memberId')
  updateProfile(
    @Param('memberId') memberId: string,
    @Body() body: { fullName?: string; phone?: string; department?: string; employeeId?: string },
  ) {
    return this.auth.updateProfile(memberId, body);
  }
}
