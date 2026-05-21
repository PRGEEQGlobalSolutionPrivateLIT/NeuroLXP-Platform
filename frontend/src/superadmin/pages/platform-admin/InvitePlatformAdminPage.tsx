'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import neoToast from '@/lib/toast';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicDatePicker } from '@/components/ui/NeumorphicDatePicker';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { platformAdminApi } from '@/lib/platform-admin-api';

export function InvitePlatformAdminPage() {
  const router = useRouter();
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
      const { data } = await platformAdminApi.invite({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        primaryEmail: form.primaryEmail,
        primaryPhone: form.primaryPhone,
        password: form.password,
      });
      setResult({ recoveryCode: data.recoveryCode, devMagicLink: data.devMagicLink });
      neoToast.success('Platform admin invited — magic link sent to email');
      setStep(3);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Invite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout
      mode="signup"
      currentStep={step}
      totalSteps={3}
      title="Platform Admin onboarding"
      subtitle="Create a new platform administrator account"
      backHref="/superadmin/dashboard"
      footer={
        step < 3 ? (
          <NeumorphicButton
            variant="primary"
            loading={loading}
            disabled={
              (step === 1 && (!form.fullName || !form.dateOfBirth || !form.primaryEmail || !form.primaryPhone)) ||
              (step === 2 && !isPasswordValid(form.password))
            }
            onClick={() => (step === 2 ? submit() : setStep(step + 1))}
          >
            {step === 2 ? 'Send magic link & create' : 'Continue'}
          </NeumorphicButton>
        ) : (
          <NeumorphicButton variant="primary" onClick={() => router.push('/superadmin/dashboard')}>
            Back to dashboard
          </NeumorphicButton>
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
            label="Initial password"
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
            A recovery code will be generated and a magic sign-in link will be emailed to the platform admin.
          </p>
        </>
      )}

      {step === 3 && result && (
        <NeumorphicCard highlight className="!p-5 space-y-4">
          <p className="neo-kicker text-left">Save these credentials</p>
          <RecoveryCodeBlock code={result.recoveryCode} />
          {result.devMagicLink && (
            <div className="neo-alert text-xs break-all">
              <strong>Dev magic link:</strong> {result.devMagicLink}
            </div>
          )}
          <p className="text-sm text-[var(--neo-muted)]">
            The platform admin must open the magic link, set a new password, configure Google Authenticator, and add
            alternative contact before accessing the dashboard.
          </p>
        </NeumorphicCard>
      )}
    </StepLayout>
  );
}

function RecoveryCodeBlock({ code }: { code?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[var(--neo-muted)]">Recovery code (one-time display)</p>
      <p className="mt-1 font-mono text-sm font-bold text-[var(--neo-primary)] break-all">{code}</p>
    </div>
  );
}
