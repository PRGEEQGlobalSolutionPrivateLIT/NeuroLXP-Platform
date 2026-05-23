'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicDatePicker } from '@/components/ui/NeumorphicDatePicker';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { platformAdminApi } from '@/lib/platform-admin-api';
import { PLATFORM_ADMIN_SIGNIN_PATH } from '@/platform-admin/lib/platform-admin-routes';
import { authPortalLayoutProps } from '@/lib/auth-portal-config';
import { useAuthDocumentTitle } from '@/lib/use-auth-document-title';
import neoToast from '@/lib/toast';

const PA_AUTH_SIGNUP = authPortalLayoutProps('platform-admin', 'signup');

export function PlatformAdminSignupWizard() {
  useAuthDocumentTitle('platform-admin', 'Sign up');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    primaryEmail: '',
    primaryPhone: '',
    password: '',
    confirmPassword: '',
  });
  const [result, setResult] = useState<{
    recoveryCode?: string;
    devMagicLink?: string;
  } | null>(null);

  const submit = async () => {
    if (!isPasswordValid(form.password) || form.password !== form.confirmPassword) {
      neoToast.error('Password does not meet requirements or does not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await platformAdminApi.signup({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        primaryEmail: form.primaryEmail,
        primaryPhone: form.primaryPhone,
        password: form.password,
      });
      setResult({ recoveryCode: data.recoveryCode, devMagicLink: data.devMagicLink });
      neoToast.success('Registration started — check your email for the magic link');
      setStep(3);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout
      {...PA_AUTH_SIGNUP}
      mode="signup"
      currentStep={step}
      totalSteps={3}
      title="Platform Admin registration"
      subtitle="Create your platform administrator account"
      backHref={PLATFORM_ADMIN_SIGNIN_PATH}
      footerLink={{ href: PLATFORM_ADMIN_SIGNIN_PATH, label: 'Already registered? Sign in' }}
      footer={
        step < 3 ? (
          <NeumorphicButton
            variant="primary"
            loading={loading}
            disabled={
              (step === 1 &&
                (!form.fullName ||
                  !form.dateOfBirth ||
                  !form.primaryEmail ||
                  !form.primaryPhone)) ||
              (step === 2 && !isPasswordValid(form.password))
            }
            onClick={() => (step === 2 ? submit() : setStep(step + 1))}
          >
            {step === 2 ? 'Register & send magic link' : 'Continue'}
          </NeumorphicButton>
        ) : (
          <Link href={PLATFORM_ADMIN_SIGNIN_PATH}>
            <NeumorphicButton variant="primary">Go to sign in</NeumorphicButton>
          </Link>
        )
      }
    >
      {step === 1 && (
        <>
          <NeumorphicInput
            label="Full name (as per document)"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <NeumorphicDatePicker
            label="Date of birth"
            value={form.dateOfBirth}
            onChange={(v) => setForm({ ...form, dateOfBirth: v })}
          />
          <NeumorphicInput
            label="Primary email"
            type="email"
            value={form.primaryEmail}
            onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })}
          />
          <NeumorphicInput
            label="Primary phone"
            value={form.primaryPhone}
            onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
          />
        </>
      )}

      {step === 2 && (
        <>
          <NeumorphicInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <NeumorphicInput
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
          <PasswordStrength password={form.password} />
          <p className="text-xs text-[var(--neo-muted)]">
            After registration you will receive a magic link by email. Open it to finish onboarding
            (new password, authenticator, alternative contact). Super Admin approval is required
            before you can sign in to the dashboard.
          </p>
        </>
      )}

      {step === 3 && result && (
        <NeumorphicCard highlight className="!p-5 space-y-4">
          <p className="neo-kicker text-left">Save your recovery code</p>
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--neo-muted)]">
              Recovery code (one-time display)
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-[var(--neo-primary)] break-all">
              {result.recoveryCode}
            </p>
          </div>
          {result.devMagicLink && (
            <div className="neo-alert text-xs break-all">
              <strong>Dev magic link:</strong>{' '}
              <a href={result.devMagicLink} className="text-[var(--neo-primary)] underline">
                {result.devMagicLink}
              </a>
            </div>
          )}
          <p className="text-sm text-[var(--neo-muted)]">
            Check your primary email for the magic link. Complete onboarding, then sign in. If your
            account is pending, request Super Admin approval on the sign-in page.
          </p>
        </NeumorphicCard>
      )}
    </StepLayout>
  );
}
