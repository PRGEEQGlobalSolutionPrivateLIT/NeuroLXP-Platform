'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { getMemberLastRole, memberPaths } from '@/member/lib/member-routes';
import { MemberRole } from '@/lib/members-api';

type PortalPage = 'dashboard' | 'profile' | 'approvals';

export function MemberLegacyRedirect({ page }: { page: PortalPage }) {
  const router = useRouter();
  const { user, hydrateFromStorage } = useMemberAuthStore();

  useEffect(() => {
    hydrateFromStorage();
    const role: MemberRole = user?.role ?? getMemberLastRole();
    router.replace(memberPaths(role)[page]);
  }, [hydrateFromStorage, user?.role, router, page]);

  return <div className="neo-page min-h-screen" />;
}
