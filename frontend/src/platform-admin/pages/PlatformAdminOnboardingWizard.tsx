'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import neoToast from '@/lib/toast';
import { toastSignInSuccess } from '@/lib/signin-feedback';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { OTPInput } from '@/components/ui/OTPInput';
import { ContactVerificationCard } from '@/components/ui/ContactVerificationCard';
import { platformAdminApi } from '@/lib/platform-admin-api';
import { apiClient } from '@/superadmin/lib/axios';
import { usePlatformAuthStore } from '@/platform-admin/store/auth.store';

type Phase = 'password' | 'totp' | 'alt_contact';

export function PlatformAdminOnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get('sessionId') || '';
  const setAuth = usePlatformAuthStore((s) => s.setAuth);
  const [phase, setPhase] = useState<Phase>('password');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userId, setUserId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [altEmail, setAltEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [altEmailOtp, setAltEmailOtp] = useState('');
  const [altPhoneOtp, setAltPhoneOtp] = useState('');

  useEffect(() => {
    if (!sessionId) router.replace('/platform-admin/auth/signin');
  }, [sessionId, router]);

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

  const titles: Record<Phase, { title: string; subtitle: string }> = {
    password: { title: 'Set your password', subtitle: 'Choose a new password. Your User ID will be assigned.' },
    totp: { title: 'Google Authenticator', subtitle: 'Scan the QR code and verify the 6-digit code.' },
    alt_contact: { title: 'Alternative contact', subtitle: 'Add and verify backup email and phone (like Super Admin).' },
  };

  const stepIndex = phase === 'password' ? 1 : phase === 'totp' ? 2 : 3;

  return (
    <StepLayout
      mode="signup"
      currentStep={stepIndex}
      totalSteps={3}
      title={titles[phase].title}
      subtitle={titles[phase].subtitle}
      footer={
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={
            (phase === 'password' && (!isPasswordValid(password) || password !== confirm)) ||
            (phase === 'totp' && totpCode.length !== 6) ||
            (phase === 'alt_contact' && (!emailVerified || !phoneVerified))
          }
          onClick={() => {
            if (phase === 'password') {
              run(async () => {
                const { data } = await platformAdminApi.resetPassword(sessionId, password);
                setUserId(data.userId);
                neoToast.success(`Password set. User ID: ${data.userId}`);
                const { data: totp } = await platformAdminApi.totpSetup(sessionId);
                setQrCode(totp.qrCodeDataUrl);
                setPhase('totp');
              });
            } else if (phase === 'totp') {
              run(async () => {
                await platformAdminApi.totpVerify(sessionId, totpCode);
                neoToast.success('Authenticator verified');
                setPhase('alt_contact');
              });
            } else {
              run(async () => {
                await platformAdminApi.setAltContact(sessionId, {
                  altEmail,
                  altPhone,
                  emailVerified,
                  phoneVerified,
                });
                const { data } = await platformAdminApi.completeOnboarding(sessionId);
                setAuth(true, { userId: data.userId, email: data.email }, data.accessToken, data.refreshToken);
                toastSignInSuccess();
                router.replace('/platform-admin/dashboard');
              });
            }
          }}
        >
          {phase === 'alt_contact' ? 'Complete setup' : 'Continue'}
        </NeumorphicButton>
      }
    >
      {phase === 'password' && (
        <>
          <NeumorphicInput label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <NeumorphicInput label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <PasswordStrength password={password} />
          {userId && <p className="text-sm font-mono text-[var(--neo-primary)]">User ID: {userId}</p>}
        </>
      )}
      {phase === 'totp' && (
        <>
          {qrCode && <img src={qrCode} alt="QR" className="mx-auto max-w-[200px] rounded-lg" />}
          <OTPInput value={totpCode} onChange={setTotpCode} label="Authenticator code" />
        </>
      )}
      {phase === 'alt_contact' && (
        <>
          <ContactVerificationCard
            label="Alternative email"
            kind="email"
            value={altEmail}
            onChange={setAltEmail}
            verified={emailVerified}
            otp={altEmailOtp}
            onOtpChange={setAltEmailOtp}
            onSend={async () => {
              const { data } = await apiClient.post<{ devOtp?: string }>('/api/otp/send', {
                identifier: altEmail,
                type: 'email',
              });
              return { devOtp: data.devOtp };
            }}
            onVerify={async () => {
              await apiClient.post('/api/otp/verify', {
                identifier: altEmail,
                type: 'email',
                otp: altEmailOtp,
              });
              setEmailVerified(true);
              neoToast.success('Alternative email verified');
            }}
          />
          <ContactVerificationCard
            label="Alternative phone"
            kind="phone"
            value={altPhone}
            onChange={setAltPhone}
            verified={phoneVerified}
            otp={altPhoneOtp}
            onOtpChange={setAltPhoneOtp}
            onSend={async () => {
              const { data } = await apiClient.post<{ devOtp?: string }>('/api/otp/send', {
                identifier: altPhone,
                type: 'sms',
              });
              return { devOtp: data.devOtp };
            }}
            onVerify={async () => {
              await apiClient.post('/api/otp/verify', {
                identifier: altPhone,
                type: 'sms',
                otp: altPhoneOtp,
              });
              setPhoneVerified(true);
              neoToast.success('Alternative phone verified');
            }}
          />
        </>
      )}
    </StepLayout>
  );
}
