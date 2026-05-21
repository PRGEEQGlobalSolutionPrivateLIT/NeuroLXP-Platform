'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import neoToast from '@/lib/toast';
import { membersApi, MemberRole } from '@/lib/members-api';
import { memberPaths, memberPageTitle, persistMemberLastRole } from '@/member/lib/member-routes';

interface Props {
  role: MemberRole;
}

export function MemberMagicPage({ role }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const paths = memberPaths(role);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    persistMemberLastRole(role);
    document.title = memberPageTitle(role, 'Magic link');
  }, [role]);

  useEffect(() => {
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setError('Invalid magic link');
      return;
    }

    membersApi
      .consumeMagic(token, email, role)
      .then(({ data }) => {
        neoToast.success('Magic link verified');
        if (data.requiresOnboarding) {
          router.replace(`${paths.onboarding}?sessionId=${data.sessionId}`);
        } else {
          router.replace(paths.signin);
        }
      })
      .catch((e: unknown) => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Magic link failed');
      });
  }, [params, router, role, paths]);

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
