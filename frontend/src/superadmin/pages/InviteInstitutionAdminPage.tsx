'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import neoToast from '@/lib/toast';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicDatePicker } from '@/components/ui/NeumorphicDatePicker';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { apiClient } from '@/superadmin/lib/axios';
import { AUTH_PORTAL_CONFIG } from '@/lib/auth-portal-config';
import { useAuthDocumentTitle } from '@/lib/use-auth-document-title';

export function InviteInstitutionAdminPage() {
  useAuthDocumentTitle('institution-admin', 'Sign up');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    primaryEmail: '',
    primaryPhone: '',
    password: '',
    confirmPassword: '',
  });
  const [result, setResult] = useState<{ recoveryCode?: string; devMagicLink?: string } | null>(null);

  const submit = async () => {
    if (!isPasswordValid(form.password) || form.password !== form.confirmPassword) {
      neoToast.error('Password does not meet requirements or does not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/institution-admin/invite', {
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        primaryEmail: form.primaryEmail,
        primaryPhone: form.primaryPhone,
        password: form.password,
      });
      setResult({ recoveryCode: data.recoveryCode, devMagicLink: data.devMagicLink });
      neoToast.success('Institution admin invited');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Invite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-page min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-xl">
        <Link href="/superadmin/add-members" className="text-sm text-[var(--neo-primary)] underline">
          ← Back to Add members
        </Link>
        <div className="neo-card mt-4 p-6 md:p-8">
          <h1 className="text-xl font-bold text-[var(--neo-text)]">Invite Institution Admin</h1>
          <p className="mt-1 text-sm text-[var(--neo-muted)]">
            {AUTH_PORTAL_CONFIG['institution-admin'].portalTitle} — create institution administrator
          </p>

          {!result ? (
            <div className="neo-form-stack mt-6">
              <NeumorphicInput
                label="Full name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
              <NeumorphicDatePicker
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
              />
              <NeumorphicInput
                label="Primary email"
                type="email"
                value={form.primaryEmail}
                onChange={(e) => setForm((f) => ({ ...f, primaryEmail: e.target.value }))}
              />
              <NeumorphicInput
                label="Primary phone"
                value={form.primaryPhone}
                onChange={(e) => setForm((f) => ({ ...f, primaryPhone: e.target.value }))}
              />
              <NeumorphicInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <PasswordStrength password={form.password} />
              <NeumorphicInput
                label="Confirm password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
              <NeumorphicButton variant="primary" loading={loading} onClick={submit}>
                Send invite
              </NeumorphicButton>
            </div>
          ) : (
            <NeumorphicCard className="mt-6 !p-4">
              <p className="text-sm font-semibold text-[var(--neo-text)]">Save recovery code (shown once)</p>
              <p className="mt-2 font-mono text-sm font-bold text-[var(--neo-primary)]">{result.recoveryCode}</p>
              {result.devMagicLink && (
                <p className="mt-3 break-all text-xs text-[var(--neo-muted)]">{result.devMagicLink}</p>
              )}
              <NeumorphicButton className="mt-4" onClick={() => router.push('/superadmin/add-members')}>
                Done
              </NeumorphicButton>
            </NeumorphicCard>
          )}
        </div>
      </div>
    </div>
  );
}
