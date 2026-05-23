'use client';

import { useState } from 'react';
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
import { OTPInput } from '@/components/ui/OTPInput';
import { DevOtpBanner } from '@/components/ui/DevOtpBanner';
import { OtpChannelPicker } from '@/components/ui/OtpChannelPicker';
import { platformAdminApi } from '@/lib/platform-admin-api';
import { usePlatformAuthStore } from '@/platform-admin/store/auth.store';
import { PLATFORM_RECOVERY_STORAGE_KEY } from '@/components/ui/RecoveryCodeAlertModal';
import { recordPaLogin } from '@/platform-admin/lib/pa-session';
import { PLATFORM_ADMIN_SIGNUP_PATH } from '@/platform-admin/lib/platform-admin-routes';
import { authPortalLayoutProps } from '@/lib/auth-portal-config';
import { useAuthDocumentTitle } from '@/lib/use-auth-document-title';

const PA_AUTH_SIGNIN = authPortalLayoutProps('platform-admin', 'signin');

type Phase = 'credentials' | 'primary_otp' | 'alt_otp' | 'totp' | 'recovery' | 'approval';

const PRIMARY_SEND = 5;
const ALT_SEND = 3;

export function PlatformAdminSigninWizard() {
  useAuthDocumentTitle('platform-admin', 'Sign in');
  const router = useRouter();
  const setAuth = usePlatformAuthStore((s) => s.setAuth);
  const [phase, setPhase] = useState<Phase>('credentials');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [primaryChannel, setPrimaryChannel] = useState<'email' | 'phone' | null>(null);
  const [altChannel, setAltChannel] = useState<'email' | 'phone' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [primarySendsRemaining, setPrimarySendsRemaining] = useState(PRIMARY_SEND);
  const [altSendsRemaining, setAltSendsRemaining] = useState(ALT_SEND);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [approvalRequested, setApprovalRequested] = useState(false);

  const run = async (fn: () => Promise<void>) => {
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
    newRecoveryCode?: string;
  }) => {
    if (data.newRecoveryCode) {
      sessionStorage.setItem(PLATFORM_RECOVERY_STORAGE_KEY, data.newRecoveryCode);
    }
    setAuth(true, { userId: data.userId ?? '', email: data.email ?? identifier }, data.accessToken, data.refreshToken);
    recordPaLogin(data.email ?? identifier, data.userId, 'Platform Admin sign-in');
    toastSignInSuccess();
    router.replace('/platform-admin/dashboard');
  };

  const advance = (next: Phase, msg?: string) => {
    if (msg) toastAutoNextMethod(msg);
    setOtp('');
    setOtpSent(false);
    setDevOtp(null);
    setPhase(next);
  };

  const sendPrimaryOtp = () =>
    run(async () => {
      if (!primaryChannel) return;
      try {
        const { data } = await platformAdminApi.sendOtp(sessionId, primaryChannel, 'primary');
        setOtpSent(true);
        if (data.devOtp) setDevOtp(data.devOtp);
        const rem = data.sendsRemaining ?? 0;
        setPrimarySendsRemaining(rem);
        toastOtpSent(rem, primaryChannel, !!data.devOtp);
        if (rem <= 0) setTimeout(() => advance('alt_otp', 'Moving to alternative contact'), 1200);
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        if (msg.toLowerCase().includes('limit')) {
          setPrimarySendsRemaining(0);
          toastSendLimitReached('primary');
          setTimeout(() => advance('alt_otp', 'Moving to alternative contact'), 1200);
        } else throw e;
      }
    });

  const sendAltOtp = () =>
    run(async () => {
      if (!altChannel) return;
      try {
        const { data } = await platformAdminApi.sendOtp(sessionId, altChannel, 'alt');
        setOtpSent(true);
        if (data.devOtp) setDevOtp(data.devOtp);
        const rem = data.sendsRemaining ?? 0;
        setAltSendsRemaining(rem);
        toastOtpSent(rem, altChannel, !!data.devOtp);
        if (rem <= 0) setTimeout(() => advance('totp', 'Moving to Google Authenticator'), 1200);
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
        if (msg.toLowerCase().includes('limit')) {
          setAltSendsRemaining(0);
          toastSendLimitReached('alt');
          setTimeout(() => advance('totp', 'Moving to Google Authenticator'), 1200);
        } else throw e;
      }
    });

  const handleVerifyResult = (
    data: { accessToken?: string; exhausted?: boolean; attemptsRemaining?: number; attemptsLimit?: number },
    nextOnExhausted: Phase,
    nextMsg: string,
  ) => {
    if (data.accessToken) {
      finishLogin(data as Parameters<typeof finishLogin>[0]);
      return;
    }
    if (data.exhausted) {
      advance(nextOnExhausted, nextMsg);
      return;
    }
    toastOtpVerifyFail(data.attemptsRemaining ?? 0, data.attemptsLimit ?? 5);
  };

  const titles: Record<Phase, { title: string; subtitle: string }> = {
    credentials: { title: 'Platform Admin Sign In', subtitle: 'Email, phone, or User ID with password' },
    primary_otp: { title: 'Verify Identity', subtitle: 'Primary contact OTP (5 sends max)' },
    alt_otp: { title: 'Alternative Verification', subtitle: 'Alternative contact OTP (3 sends max)' },
    totp: { title: 'Google Authenticator', subtitle: 'Use the same QR code from onboarding' },
    recovery: { title: 'Recovery Code', subtitle: 'Code provided at invite' },
    approval: { title: 'Super Admin Approval', subtitle: 'Final step — request approval to access dashboard' },
  };

  const body = () => {
    switch (phase) {
      case 'credentials':
        return (
          <>
            <NeumorphicInput label="Email / User ID / Phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <NeumorphicInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        );
      case 'primary_otp':
        return !otpSent ? (
          <>
            <OtpChannelPicker emailLabel={maskedEmail} phoneLabel={maskedPhone} selected={primaryChannel} onSelect={setPrimaryChannel} />
            <NeumorphicButton variant="primary" className="mt-5 w-full" disabled={!primaryChannel || primarySendsRemaining <= 0} onClick={sendPrimaryOtp}>
              Send OTP
            </NeumorphicButton>
          </>
        ) : (
          <div className="neo-form-stack">
            {devOtp && <DevOtpBanner code={devOtp} />}
            <OTPInput value={otp} onChange={setOtp} />
            {primarySendsRemaining > 0 && <NeumorphicButton onClick={sendPrimaryOtp}>Resend OTP</NeumorphicButton>}
          </div>
        );
      case 'alt_otp':
        return !otpSent ? (
          <>
            <OtpChannelPicker emailLabel="Alternative email" phoneLabel="Alternative phone" selected={altChannel} onSelect={setAltChannel} />
            <NeumorphicButton variant="primary" className="mt-5 w-full" disabled={!altChannel || altSendsRemaining <= 0} onClick={sendAltOtp}>
              Send OTP
            </NeumorphicButton>
          </>
        ) : (
          <div className="neo-form-stack">
            {devOtp && <DevOtpBanner code={devOtp} />}
            <OTPInput value={otp} onChange={setOtp} />
            {altSendsRemaining > 0 && <NeumorphicButton onClick={sendAltOtp}>Resend OTP</NeumorphicButton>}
          </div>
        );
      case 'totp':
        return <OTPInput value={totpCode} onChange={setTotpCode} label="Authenticator code" />;
      case 'recovery':
        return <NeumorphicInput label="Recovery code" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />;
      case 'approval':
        return (
          <NeumorphicCard className="!p-4 text-sm">
            {approvalRequested ? (
              <p>Waiting for Super Admin to approve your access. Click below to check status.</p>
            ) : (
              <p>Request Super Admin approval to complete sign-in.</p>
            )}
          </NeumorphicCard>
        );
    }
  };

  const footer = () => {
    if (phase === 'credentials') {
      return (
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={!identifier || !password}
          onClick={() =>
            run(async () => {
              const { data } = await platformAdminApi.primarySignin(identifier, password);
              setSessionId(data.sessionId);
              setMaskedEmail(data.maskedEmail);
              setMaskedPhone(data.maskedPhone);
              toastPasswordMatched();
              setPhase('primary_otp');
            })
          }
        >
          Sign in
        </NeumorphicButton>
      );
    }
    if (phase === 'primary_otp' && otpSent) {
      return (
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={otp.length !== 6}
          onClick={() =>
            run(async () => {
              if (!primaryChannel) return;
              const { data } = await platformAdminApi.verifyOtp(sessionId, primaryChannel, otp, 'primary');
              handleVerifyResult(data, 'alt_otp', 'Trying alternative contact');
            })
          }
        >
          Verify
        </NeumorphicButton>
      );
    }
    if (phase === 'alt_otp' && otpSent) {
      return (
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={otp.length !== 6}
          onClick={() =>
            run(async () => {
              if (!altChannel) return;
              const { data } = await platformAdminApi.verifyOtp(sessionId, altChannel, otp, 'alt');
              handleVerifyResult(data, 'totp', 'Trying authenticator');
            })
          }
        >
          Verify
        </NeumorphicButton>
      );
    }
    if (phase === 'totp') {
      return (
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={totpCode.length !== 6}
          onClick={() =>
            run(async () => {
              const { data } = await platformAdminApi.totp(sessionId, totpCode);
              if (data.accessToken) finishLogin(data);
              else advance('recovery', 'Authenticator failed — try recovery code');
            })
          }
        >
          Verify
        </NeumorphicButton>
      );
    }
    if (phase === 'recovery') {
      return (
        <NeumorphicButton
          variant="primary"
          loading={loading}
          onClick={() =>
            run(async () => {
              const { data } = await platformAdminApi.recovery(sessionId, recoveryCode);
              if (data.matched) {
                if (data.newRecoveryCode) {
                  sessionStorage.setItem(PLATFORM_RECOVERY_STORAGE_KEY, data.newRecoveryCode);
                }
                neoToast.info('Recovery code accepted — request Super Admin approval');
                await platformAdminApi.requestApproval(sessionId);
                setApprovalRequested(true);
                setPhase('approval');
              } else neoToast.error('Invalid recovery code');
            })
          }
        >
          Verify recovery
        </NeumorphicButton>
      );
    }
    if (phase === 'approval') {
      return (
        <>
          {!approvalRequested && (
            <NeumorphicButton
              variant="primary"
              loading={loading}
              onClick={() =>
                run(async () => {
                  await platformAdminApi.requestApproval(sessionId);
                  setApprovalRequested(true);
                  neoToast.info('Approval requested');
                })
              }
            >
              Request approval
            </NeumorphicButton>
          )}
          <NeumorphicButton
            loading={loading}
            onClick={() =>
              run(async () => {
                const { data } = await platformAdminApi.checkApproval(sessionId);
                if (data.accessToken) finishLogin(data);
                else neoToast.info('Still waiting for Super Admin approval');
              })
            }
          >
            Check approval status
          </NeumorphicButton>
        </>
      );
    }
    return null;
  };

  return (
    <StepLayout
      {...PA_AUTH_SIGNIN}
      mode="signin"
      currentStep={1}
      totalSteps={6}
      title={titles[phase].title}
      subtitle={titles[phase].subtitle}
      footerLink={{
        href: PLATFORM_ADMIN_SIGNUP_PATH,
        label: 'New platform admin? Register here',
      }}
      footer={footer()}
    >
      {body()}
    </StepLayout>
  );
}
