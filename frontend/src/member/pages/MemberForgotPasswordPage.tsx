'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import neoToast from '@/lib/toast';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { OTPInput } from '@/components/ui/OTPInput';
import { DevOtpBanner } from '@/components/ui/DevOtpBanner';
import { membersApi, MemberRole } from '@/lib/members-api';
import { memberPaths, MEMBER_ROLE_LABELS, memberAuthShellProps, memberPageTitle, persistMemberLastRole } from '@/member/lib/member-routes';

type Phase = 'email' | 'password' | 'otp' | 'done';

interface Props {
  role: MemberRole;
}

export function MemberForgotPasswordPage({ role }: Props) {
  const paths = memberPaths(role);
  const shell = memberAuthShellProps(role);
  const searchParams = useSearchParams();

  useEffect(() => {
    persistMemberLastRole(role);
    document.title = memberPageTitle(role, 'Forgot password');
  }, [role]);

  const [phase, setPhase] = useState<Phase>('email');
  const [identifier, setIdentifier] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromSignin = searchParams.get('identifier');
    if (fromSignin) setIdentifier(fromSignin);
  }, [searchParams]);

  return (
    <StepLayout
      mode="signin"
      currentStep={phase === 'email' ? 1 : phase === 'password' ? 2 : phase === 'otp' ? 3 : 4}
      totalSteps={4}
      portalTitle={shell.portalTitle}
      tagline={shell.tagline}
      footerLink={shell.footerLink}
      title={`${MEMBER_ROLE_LABELS[role]} — Forgot password`}
      subtitle="Use email, User ID, or phone — OTP is sent to your registered email"
      footer={
        phase === 'email' ? (
          <NeumorphicButton variant="primary" loading={loading} disabled={!identifier.trim()} onClick={async () => {
            setLoading(true);
            try {
              const { data } = await membersApi.forgotStart(identifier.trim(), role);
              setSessionId(data.sessionId);
              setMaskedEmail(data.maskedEmail);
              setPhase('password');
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              neoToast.error(msg || 'Account not found');
            } finally {
              setLoading(false);
            }
          }}>
            Continue
          </NeumorphicButton>
        ) : phase === 'password' ? (
          <NeumorphicButton variant="primary" loading={loading} disabled={!isPasswordValid(password) || password !== confirm} onClick={async () => {
            setLoading(true);
            try {
              await membersApi.forgotSetPassword(sessionId, password, confirm);
              const { data } = await membersApi.forgotSendOtp(sessionId);
              if (data.devOtp) setDevOtp(data.devOtp);
              setPhase('otp');
              neoToast.success(`OTP sent to ${maskedEmail}`);
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              neoToast.error(msg || 'Failed');
            } finally {
              setLoading(false);
            }
          }}>
            Send OTP
          </NeumorphicButton>
        ) : phase === 'otp' ? (
          <NeumorphicButton variant="primary" loading={loading} disabled={otp.length !== 6} onClick={async () => {
            setLoading(true);
            try {
              await membersApi.forgotVerifyOtp(sessionId, otp);
              setPhase('done');
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              neoToast.error(msg || 'Invalid OTP');
            } finally {
              setLoading(false);
            }
          }}>
            Verify OTP
          </NeumorphicButton>
        ) : (
          <Link href={paths.signin}>
            <NeumorphicButton variant="primary">Back to sign in</NeumorphicButton>
          </Link>
        )
      }
    >
      {phase === 'email' && (
        <NeumorphicInput
          label="Email / User ID / Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
        />
      )}
      {phase === 'password' && (
        <>
          <NeumorphicInput label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <NeumorphicInput label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <PasswordStrength password={password} />
        </>
      )}
      {phase === 'otp' && (
        <>
          {devOtp && <DevOtpBanner code={devOtp} />}
          <OTPInput value={otp} onChange={setOtp} label={`OTP sent to ${maskedEmail}`} />
        </>
      )}
      {phase === 'done' && (
        <NeumorphicCard highlight className="!p-5 border-4 border-green-500">
          <p className="font-bold text-green-700">Password reset completed</p>
          <p className="mt-2 text-sm text-[var(--neo-muted)]">Sign in with your new password.</p>
        </NeumorphicCard>
      )}
      {phase !== 'done' && (
        <Link href={paths.signin} className="text-sm text-[var(--neo-primary)] underline">
          Back to sign in
        </Link>
      )}
    </StepLayout>
  );
}
