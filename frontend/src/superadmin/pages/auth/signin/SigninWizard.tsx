'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import neoToast from '@/lib/toast';
import {
  toastAutoNextMethod,
  toastOtpSent,
  toastOtpVerifyFail,
  toastPasswordMatched,
  toastSendLimitReached,
  toastSignInSuccess,
} from '@/lib/signin-feedback';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { NeumorphicCheckbox } from '@/components/ui/NeumorphicCheckbox';
import { OTPInput } from '@/components/ui/OTPInput';
import { DevOtpBanner } from '@/components/ui/DevOtpBanner';
import { OtpChannelPicker } from '@/components/ui/OtpChannelPicker';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { signinApi } from '@/lib/api';
import { recordSaLogin } from '@/superadmin/lib/sa-session';
import { apiClient } from '@/superadmin/lib/axios';
import { authPortalLayoutProps } from '@/lib/auth-portal-config';
import { useAuthDocumentTitle } from '@/lib/use-auth-document-title';

const SA_AUTH_SIGNIN = authPortalLayoutProps('superadmin', 'signin');
import { useAuthStore } from '@/superadmin/store/auth.store';

type Phase =
  | 'credentials'
  | 'primary_otp'
  | 'alt_otp'
  | 'totp'
  | 'recovery'
  | 'security_code'
  | 'govt_id'
  | 'security_qa'
  | 'approver';

const PHASE_TITLES: Record<Phase, { title: string; subtitle: string }> = {
  credentials: {
    title: 'Sign In',
    subtitle: 'Enter your email, user ID, or phone number with password.',
  },
  primary_otp: {
    title: 'Verify Identity',
    subtitle: 'Choose how to receive your one-time password.',
  },
  alt_otp: {
    title: 'Alternative Verification',
    subtitle: 'Primary OTP attempts exhausted. Use your alternative contact.',
  },
  totp: {
    title: 'Google Authenticator',
    subtitle: 'Open your authenticator app and enter the 6-digit code.',
  },
  recovery: {
    title: 'Recovery Code',
    subtitle: 'Enter the recovery code you saved during registration.',
  },
  security_code: {
    title: 'Security Code',
    subtitle: 'Enter any one of your 9 security codes.',
  },
  govt_id: {
    title: 'Government ID',
    subtitle: 'Enter the ID number you registered during signup.',
  },
  security_qa: {
    title: 'Security Questions',
    subtitle: 'Answer the security questions you set during registration.',
  },
  approver: {
    title: 'Secondary Approver',
    subtitle: 'Last resort verification — contact your designated approver.',
  },
};

export function SigninWizard() {
  useAuthDocumentTitle('superadmin', 'Sign in');
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phase, setPhase] = useState<Phase>('credentials');
  const [loading, setLoading] = useState(false);

  const [sessionId, setSessionId] = useState('');
  const [superAdminId, setSuperAdminId] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [maskedAltEmail, setMaskedAltEmail] = useState('');
  const [maskedAltPhone, setMaskedAltPhone] = useState('');

  const [primaryChannel, setPrimaryChannel] = useState<'email' | 'phone' | null>(null);
  const [altChannel, setAltChannel] = useState<'email' | 'phone' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [primarySendCount, setPrimarySendCount] = useState(0);
  const [primarySendsRemaining, setPrimarySendsRemaining] = useState(5);
  const [altSendCount, setAltSendCount] = useState(0);
  const [altSendsRemaining, setAltSendsRemaining] = useState(3);

  const PRIMARY_OTP_SEND_LIMIT = 5;
  const ALT_OTP_SEND_LIMIT = 3;

  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState('');
  const [recoveryAck, setRecoveryAck] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [govtId, setGovtId] = useState('');
  const [answers, setAnswers] = useState({ a1: '', a2: '', a3: '' });
  const [questions, setQuestions] = useState({ q1: '', q2: '', q3: '' });
  const [wrongQIndex, setWrongQIndex] = useState<number | null>(null);
  const [approverInfo, setApproverInfo] = useState<Record<string, string>>({});
  const [approvalCode, setApprovalCode] = useState('');
  const [approvalRequested, setApprovalRequested] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgot, setForgot] = useState({ newPassword: '', confirm: '', otp: '' });

  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = (data: {
    accessToken: string;
    refreshToken: string;
    userId?: string;
    email?: string;
  }) => {
    const email = data.email ?? (identifier || 'admin@neurolxp.com');
    const userId = data.userId ?? 'SA-000000';
    setAuth(true, { userId, email }, data.accessToken, data.refreshToken);
    recordSaLogin(email, userId, 'Super Admin sign-in');
    toastSignInSuccess();
    router.replace('/superadmin/dashboard');
  };

  const advance = (next: Phase, toastMsg?: string) => {
    if (toastMsg) toastAutoNextMethod(toastMsg);
    setOtp('');
    setOtpSent(false);
    setDevOtp(null);
    setPrimaryChannel(null);
    setAltChannel(null);
    if (next === 'alt_otp') {
      setAltSendCount(0);
      setAltSendsRemaining(ALT_OTP_SEND_LIMIT);
    }
    setPhase(next);
  };

  const goToAltOtp = (reason: string) => advance('alt_otp', reason);
  const goToTotp = (reason: string) => advance('totp', reason);

  type OtpSendMeta = {
    sendCount?: number;
    sendsRemaining?: number;
    devOtp?: string;
    maskedEmail?: string | null;
    maskedPhone?: string | null;
  };

  const applyPrimarySendMeta = (data: OtpSendMeta) => {
    if (data.sendCount != null) setPrimarySendCount(data.sendCount);
    if (data.sendsRemaining != null) setPrimarySendsRemaining(data.sendsRemaining);
  };

  const applyAltSendMeta = (data: OtpSendMeta) => {
    if (data.sendCount != null) setAltSendCount(data.sendCount);
    if (data.sendsRemaining != null) setAltSendsRemaining(data.sendsRemaining);
    if (data.maskedEmail) setMaskedAltEmail(data.maskedEmail);
    if (data.maskedPhone) setMaskedAltPhone(data.maskedPhone);
  };

  const sendPrimaryOtp = () =>
    run(async () => {
      if (!primaryChannel) return;
      try {
        const { data } = await signinApi.sendOtp(sessionId, primaryChannel, 'primary');
        setOtpSent(true);
        applyPrimarySendMeta(data);
        if (data.devOtp) setDevOtp(data.devOtp);
        const remaining = data.sendsRemaining ?? primarySendsRemaining - 1;
        toastOtpSent(remaining, primaryChannel, !!data.devOtp);
        if (data.sendLimitReached || remaining <= 0) {
          setPrimarySendsRemaining(0);
          setTimeout(() => goToAltOtp('Moving to alternative contact verification'), 1200);
        }
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        if (msg.toLowerCase().includes('limit')) {
          setPrimarySendsRemaining(0);
          toastSendLimitReached('primary');
          setTimeout(() => goToAltOtp('Moving to alternative contact verification'), 1200);
        } else {
          throw e;
        }
      }
    });

  const sendAltOtp = () =>
    run(async () => {
      if (!altChannel) return;
      try {
        const { data } = await signinApi.sendOtp(sessionId, altChannel, 'alt');
        setOtpSent(true);
        applyAltSendMeta(data);
        if (data.devOtp) setDevOtp(data.devOtp);
        const remaining = data.sendsRemaining ?? altSendsRemaining - 1;
        toastOtpSent(remaining, altChannel, !!data.devOtp);
        if (data.sendLimitReached || remaining <= 0) {
          setAltSendsRemaining(0);
          setTimeout(() => goToTotp('Moving to Google Authenticator'), 1200);
        }
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        if (msg.toLowerCase().includes('limit')) {
          setAltSendsRemaining(0);
          toastSendLimitReached('alt');
          setTimeout(() => goToTotp('Moving to Google Authenticator'), 1200);
        } else {
          throw e;
        }
      }
    });

  type VerifyOtpResult = {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
    email?: string;
    exhausted?: boolean;
    attemptsRemaining?: number;
    attemptsLimit?: number;
    valid?: boolean;
  };

  const handlePrimaryVerifyResult = (data: VerifyOtpResult) => {
    if (data.accessToken) {
      finishLogin(data as Parameters<typeof finishLogin>[0]);
      return;
    }
    if (data.exhausted) {
      goToAltOtp('Primary OTP failed · Trying alternative contact');
      return;
    }
    const remaining = data.attemptsRemaining ?? 0;
    const limit = data.attemptsLimit ?? 5;
    toastOtpVerifyFail(remaining, limit);
  };

  const handleAltVerifyResult = (data: VerifyOtpResult) => {
    if (data.accessToken) {
      finishLogin(data as Parameters<typeof finishLogin>[0]);
      return;
    }
    if (data.exhausted) {
      goToTotp('Alternative OTP failed · Trying authenticator app');
      return;
    }
    const remaining = data.attemptsRemaining ?? 0;
    const limit = data.attemptsLimit ?? 3;
    toastOtpVerifyFail(remaining, limit);
  };

  const otpSendLimitLabel = (count: number, limit: number, remaining: number) =>
    remaining > 0
      ? `${count} of ${limit} OTP sends used · ${remaining} remaining`
      : `OTP send limit reached (${limit}/${limit})`;

  useEffect(() => {
    if (phase === 'security_qa' && superAdminId) {
      signinApi.securityQuestions(superAdminId).then(({ data }) => setQuestions(data));
    }
  }, [phase, superAdminId]);

  const footer = (onNext: () => void, disabled?: boolean, label = 'Continue') => (
    <NeumorphicButton variant="primary" onClick={onNext} disabled={disabled || loading} loading={loading} className="w-full sm:w-auto">
      {label}
    </NeumorphicButton>
  );

  const { title, subtitle } = PHASE_TITLES[phase];

  const renderBody = () => {
    switch (phase) {
      case 'credentials':
        return (
          <>
            <NeumorphicInput
              label="Email / User ID / Phone"
              placeholder="e.g. PRGEEQR830309 or admin@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <NeumorphicInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-4"
            />
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[var(--neo-primary)] hover:underline"
              onClick={() => setShowForgot((v) => !v)}
            >
              Forgot password?
            </button>
            {showForgot && (
              <NeumorphicCard className="mt-4 !p-5">
                <p className="mb-4 text-sm font-medium text-[var(--neo-text)]">Reset password</p>
                <NeumorphicInput
                  label="New password"
                  type="password"
                  value={forgot.newPassword}
                  onChange={(e) => setForgot({ ...forgot, newPassword: e.target.value })}
                />
                <PasswordStrength password={forgot.newPassword} />
                <NeumorphicInput
                  label="Confirm password"
                  type="password"
                  value={forgot.confirm}
                  onChange={(e) => setForgot({ ...forgot, confirm: e.target.value })}
                  className="mt-3"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <NeumorphicButton
                    onClick={() =>
                      run(async () => {
                        const { data } = await apiClient.post<{ devOtp?: string }>('/api/otp/send', {
                          identifier,
                          type: 'email',
                        });
                        if (data.devOtp) {
                          setDevOtp(data.devOtp);
                          neoToast.success('OTP sent — use the dev code shown below');
                        } else {
                          neoToast.success('OTP sent to your registered email');
                        }
                      })
                    }
                  >
                    Send OTP
                  </NeumorphicButton>
                </div>
                <div className="mt-3 space-y-3">
                  {devOtp && <DevOtpBanner code={devOtp} />}
                  <OTPInput value={forgot.otp} onChange={(v) => setForgot({ ...forgot, otp: v })} />
                </div>
                <NeumorphicButton
                  variant="primary"
                  className="mt-4 w-full"
                  onClick={() =>
                    run(async () => {
                      if (!isPasswordValid(forgot.newPassword) || forgot.newPassword !== forgot.confirm) {
                        neoToast.error('Please check password requirements');
                        return;
                      }
                      await signinApi.forgotPassword(identifier, forgot.newPassword, forgot.otp);
                      neoToast.success('Password reset successful');
                      setShowForgot(false);
                    })
                  }
                >
                  Reset password
                </NeumorphicButton>
              </NeumorphicCard>
            )}
          </>
        );

      case 'primary_otp':
        return (
          <>
            <p className="text-xs text-[var(--neo-muted)]">
              {otpSendLimitLabel(primarySendCount, PRIMARY_OTP_SEND_LIMIT, primarySendsRemaining)}
            </p>
            {!otpSent ? (
              <>
                <OtpChannelPicker
                  emailLabel={maskedEmail}
                  phoneLabel={maskedPhone}
                  selected={primaryChannel}
                  onSelect={setPrimaryChannel}
                />
                <NeumorphicButton
                  variant="primary"
                  className="mt-5 w-full"
                  disabled={!primaryChannel || primarySendsRemaining <= 0}
                  onClick={sendPrimaryOtp}
                >
                  Send OTP
                </NeumorphicButton>
              </>
            ) : (
              <div className="neo-form-stack">
                <span className="neo-badge-success w-fit">OTP sent</span>
                {devOtp && <DevOtpBanner code={devOtp} />}
                <OTPInput value={otp} onChange={setOtp} />
                {primarySendsRemaining > 0 && (
                  <NeumorphicButton className="w-full text-sm" onClick={sendPrimaryOtp} disabled={loading}>
                    Resend OTP
                  </NeumorphicButton>
                )}
                {primarySendsRemaining > 0 && (
                  <button
                    type="button"
                    className="text-xs text-[var(--neo-primary)] hover:underline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setDevOtp(null);
                    }}
                  >
                    Change delivery method
                  </button>
                )}
              </div>
            )}
          </>
        );

      case 'alt_otp':
        return (
          <>
            <div className="neo-alert neo-alert--warning mb-4">
              Primary verification failed. Use your alternative contact.
            </div>
            <p className="mb-3 text-xs text-[var(--neo-muted)]">
              {otpSendLimitLabel(altSendCount, ALT_OTP_SEND_LIMIT, altSendsRemaining)}
            </p>
            {!otpSent ? (
              <>
                <OtpChannelPicker
                  emailLabel={maskedAltEmail || 'Alternative email'}
                  phoneLabel={maskedAltPhone || 'Alternative phone'}
                  selected={altChannel}
                  onSelect={setAltChannel}
                />
                <NeumorphicButton
                  variant="primary"
                  className="mt-5 w-full"
                  disabled={!altChannel || altSendsRemaining <= 0}
                  onClick={sendAltOtp}
                >
                  Send OTP
                </NeumorphicButton>
              </>
            ) : (
              <div className="neo-form-stack">
                <span className="neo-badge-success w-fit">OTP sent</span>
                {devOtp && <DevOtpBanner code={devOtp} />}
                <OTPInput value={otp} onChange={setOtp} />
                {altSendsRemaining > 0 && (
                  <NeumorphicButton className="w-full text-sm" onClick={sendAltOtp} disabled={loading}>
                    Resend OTP
                  </NeumorphicButton>
                )}
              </div>
            )}
          </>
        );

      case 'totp':
        return <OTPInput value={totpCode} onChange={setTotpCode} label="Authenticator code" />;

      case 'recovery':
        return !newRecoveryCode ? (
          <NeumorphicInput
            label="Recovery code"
            placeholder="PRGEEQ..."
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
          />
        ) : (
          <>
            <NeumorphicCard highlight className="!p-5">
              <p className="neo-field-label mb-2">Your new recovery code</p>
              <p className="break-all font-mono text-sm font-bold tracking-wide text-[var(--neo-primary)]">
                {newRecoveryCode}
              </p>
            </NeumorphicCard>
            <p className="neo-alert neo-alert--warning mt-4">
              Save this code safely. It regenerates after each use.
            </p>
            <NeumorphicCheckbox
              className="mt-4"
              checked={recoveryAck}
              onChange={setRecoveryAck}
              label="I have saved my new recovery code safely"
            />
          </>
        );

      case 'security_code':
        return (
          <NeumorphicInput
            label="Security code"
            placeholder="6-character code"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.toUpperCase())}
          />
        );

      case 'govt_id':
        return (
          <NeumorphicInput
            label="Government ID number"
            placeholder="As registered during signup"
            value={govtId}
            onChange={(e) => setGovtId(e.target.value)}
          />
        );

      case 'security_qa':
        return (
          <>
            {[1, 2, 3].map((i) => (
              <NeumorphicInput
                key={i}
                label={questions[`q${i}` as keyof typeof questions] || `Question ${i}`}
                value={answers[`a${i}` as keyof typeof answers]}
                onChange={(e) => setAnswers({ ...answers, [`a${i}`]: e.target.value })}
                className={wrongQIndex === i - 1 ? 'mb-3 rounded-lg ring-2 ring-[var(--neo-danger)]' : 'mb-3'}
              />
            ))}
          </>
        );

      case 'approver':
        return (
          <>
            <div className="neo-alert neo-alert--warning mb-4">
              Last step. If verification fails, OTP methods reset after 5 hours.
            </div>
            {approverInfo.approverName && (
              <NeumorphicCard className="!p-4 text-sm">
                <p><span className="text-[var(--neo-muted)]">Name:</span> {approverInfo.approverName}</p>
                <p className="mt-1"><span className="text-[var(--neo-muted)]">Role:</span> {approverInfo.designation}</p>
                <p className="mt-1"><span className="text-[var(--neo-muted)]">Email:</span> {approverInfo.maskedEmail}</p>
                <p className="mt-1"><span className="text-[var(--neo-muted)]">Phone:</span> {approverInfo.maskedPhone}</p>
              </NeumorphicCard>
            )}
            {!approvalRequested ? (
              <NeumorphicButton
                variant="primary"
                className="mt-4 w-full"
                onClick={() =>
                  run(async () => {
                    const { data } = await signinApi.requestApproval(sessionId);
                    setApproverInfo(data);
                    setApprovalRequested(true);
                    neoToast.success('Approval code sent to approver');
                  })
                }
              >
                Send approval request
              </NeumorphicButton>
            ) : (
              <NeumorphicInput
                label="Code from approver"
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value)}
                className="mt-4"
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (phase) {
      case 'credentials':
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.primary(identifier, password);
              if (data.passwordMatched) {
                toastPasswordMatched();
                setSessionId(data.sessionId);
                setSuperAdminId(data.superAdminId);
                setMaskedEmail(data.maskedEmail);
                setMaskedPhone(data.maskedPhone);
                setDevOtp(null);
                setPhase('primary_otp');
              }
            }),
          !identifier || !password,
          'Sign in',
        );

      case 'primary_otp':
        if (!otpSent) return null;
        return footer(
          () =>
            run(async () => {
              if (!primaryChannel) return;
              const { data } = await signinApi.verifyOtp(sessionId, primaryChannel, otp, 'primary');
              handlePrimaryVerifyResult(data);
            }),
          otp.length !== 6,
          'Verify & sign in',
        );

      case 'alt_otp':
        if (!otpSent) return null;
        return footer(
          () =>
            run(async () => {
              if (!altChannel) return;
              const { data } = await signinApi.verifyOtp(sessionId, altChannel, otp, 'alt');
              handleAltVerifyResult(data);
            }),
          otp.length !== 6,
          'Verify & sign in',
        );

      case 'totp':
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.totp(sessionId, totpCode);
              if (data.accessToken) finishLogin(data);
              else advance('recovery', 'Authenticator code did not match.');
            }),
          totpCode.length !== 6,
          'Sign in',
        );

      case 'recovery':
        return footer(
          () =>
            run(async () => {
              if (newRecoveryCode && recoveryAck) {
                const { data } = await signinApi.recoveryAck(sessionId);
                if (data.accessToken) finishLogin(data);
                return;
              }
              const { data } = await signinApi.recovery(sessionId, recoveryCode);
              if (data.matched) {
                setNewRecoveryCode(data.newRecoveryCode);
                neoToast.success('New recovery code generated');
              } else advance('security_code', 'Recovery code did not match.');
            }),
          newRecoveryCode ? !recoveryAck : !recoveryCode,
          newRecoveryCode ? 'Sign in' : 'Verify',
        );

      case 'security_code':
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.securityCode(sessionId, securityCode);
              if (data.accessToken) finishLogin(data);
              else advance('govt_id', 'Security code did not match.');
            }),
          !securityCode,
          'Sign in',
        );

      case 'govt_id':
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.govtId(sessionId, govtId);
              if (data.accessToken) finishLogin(data);
              else advance('security_qa', 'ID verification failed.');
            }),
          !govtId,
          'Sign in',
        );

      case 'security_qa':
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.verifySecurityQuestions(sessionId, answers);
              if (data.accessToken) finishLogin(data);
              else if (data.partial) {
                setWrongQIndex(data.wrongIndex ?? null);
                neoToast.error(data.message || 'One answer is incorrect');
              } else advance('approver', 'Security questions failed.');
            }),
          !answers.a1 || !answers.a2 || !answers.a3,
          'Sign in',
        );

      case 'approver':
        if (!approvalRequested) return null;
        return footer(
          () =>
            run(async () => {
              const { data } = await signinApi.verifyApproval(sessionId, approvalCode);
              if (data.accessToken) finishLogin(data);
            }),
          !approvalCode,
          'Sign in',
        );

      default:
        return null;
    }
  };

  return (
    <StepLayout
      {...SA_AUTH_SIGNIN}
      mode="signin"
      currentStep={1}
      totalSteps={1}
      title={title}
      subtitle={subtitle}
      footer={renderFooter()}
      backHref={phase === 'credentials' ? '/' : undefined}
    >
      {renderBody()}
    </StepLayout>
  );
}
