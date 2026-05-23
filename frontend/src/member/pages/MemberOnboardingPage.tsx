'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import neoToast from '@/lib/toast';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { OTPInput } from '@/components/ui/OTPInput';
import { membersApi, MemberRole } from '@/lib/members-api';
import { useMemberAuthStore } from '@/member/store/auth.store';
import {
  memberPaths,
  memberRecoveryStorageKey,
  memberUserIdStorageKey,
  memberAuthShellProps,
  memberPageTitle,
  MEMBER_TOTP_APP_LABEL,
  persistMemberLastRole,
} from '@/member/lib/member-routes';

type Phase = 'password' | 'totp';

interface Props {
  role: MemberRole;
}

export function MemberOnboardingPage({ role }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const paths = memberPaths(role);
  const shell = memberAuthShellProps(role);

  useEffect(() => {
    persistMemberLastRole(role);
    document.title = memberPageTitle(role, 'Onboarding');
  }, [role]);
  const sessionId = params.get('sessionId') || '';
  const setAuth = useMemberAuthStore((s) => s.setAuth);
  const [phase, setPhase] = useState<Phase>('password');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    if (!sessionId) router.replace(paths.signin);
  }, [sessionId, router, paths.signin]);

  return (
    <StepLayout
      mode="signup"
      currentStep={phase === 'password' ? 1 : 2}
      totalSteps={2}
      portalTitle={shell.portalTitle}
      tagline={shell.tagline}
      footerLink={shell.footerLink}
      title={phase === 'password' ? 'Set your password' : 'Google Authenticator'}
      subtitle={
        phase === 'password'
          ? 'Required setup before you can use the platform'
          : `Scan QR in Google Authenticator (${MEMBER_TOTP_APP_LABEL[role]}) — fallback sign-in`
      }
      footer={
        <NeumorphicButton
          variant="primary"
          loading={loading}
          disabled={
            (phase === 'password' && (!isPasswordValid(password) || password !== confirm)) ||
            (phase === 'totp' && totpCode.length !== 6)
          }
          onClick={async () => {
            setLoading(true);
            try {
              if (phase === 'password') {
                await membersApi.onboardingPassword(sessionId, password, confirm);
                const { data } = await membersApi.totpSetup(sessionId);
                setQrCode(data.qrCodeDataUrl);
                setPhase('totp');
                neoToast.success('Password set');
              } else {
                await membersApi.totpVerify(sessionId, totpCode);
                const { data } = await membersApi.completeOnboarding(sessionId);
                if (data.newRecoveryCode) {
                  sessionStorage.setItem(memberRecoveryStorageKey(role), data.newRecoveryCode);
                }
                if (data.userId) {
                  sessionStorage.setItem(memberUserIdStorageKey(role), data.userId);
                }
                setAuth(
                  {
                    memberId: data.memberId,
                    email: data.email,
                    fullName: data.fullName,
                    role: data.role,
                    userId: data.userId,
                    mustChangePassword: false,
                  },
                  data.accessToken,
                  data.refreshToken,
                );
                neoToast.success('Setup complete');
                router.replace(paths.dashboard);
              }
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              neoToast.error(msg || 'Failed');
            } finally {
              setLoading(false);
            }
          }}
        >
          {phase === 'totp' ? 'Complete setup' : 'Continue'}
        </NeumorphicButton>
      }
    >
      {phase === 'password' && (
        <>
          <NeumorphicInput label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <NeumorphicInput label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <PasswordStrength password={password} />
        </>
      )}
      {phase === 'totp' && (
        <>
          {qrCode && <img src={qrCode} alt="QR" className="mx-auto max-w-[200px] rounded-lg" />}
          <OTPInput value={totpCode} onChange={setTotpCode} label="Verify authenticator code" />
        </>
      )}
    </StepLayout>
  );
}
