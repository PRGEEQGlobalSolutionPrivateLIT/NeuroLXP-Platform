'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import neoToast from '@/lib/toast';
import { institutionAdminApi } from '@/lib/institution-admin-api';
import { useAuthDocumentTitle } from '@/lib/use-auth-document-title';

export function InstitutionAdminMagicPage() {
  useAuthDocumentTitle('institution-admin', 'Magic link');
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setError('Invalid magic link');
      return;
    }

    institutionAdminApi
      .consumeMagicLink(token, email)
      .then(({ data }) => {
        neoToast.success('Magic link verified');
        if (data.onboardingCompleted) {
          router.replace('/institution-admin/auth/signin');
        } else {
          router.replace(`/institution-admin/auth/onboarding?sessionId=${data.sessionId}`);
        }
      })
      .catch((e: unknown) => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Magic link failed');
      });
  }, [params, router]);

  return (
    <div className="neo-page flex min-h-screen items-center justify-center p-8">
      {error ? (
        <p className="text-center text-[var(--neo-danger)]">{error}</p>
      ) : (
        <p className="text-center text-[var(--neo-muted)]">Verifying magic link…</p>
      )}
    </div>
  );
}

