'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberAuthStore } from '@/member/store/auth.store';
import {
  defaultMemberSigninPath,
  isMemberRole,
  memberPaths,
} from '@/member/lib/member-routes';
import { MemberRole } from '@/lib/members-api';

export function MemberRoleGuard({
  roleParam,
  children,
}: {
  roleParam: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, hydrateFromStorage, isAuthenticated } = useMemberAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!isMemberRole(roleParam)) {
      router.replace(defaultMemberSigninPath());
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('memberAccessToken') : null;
    if (!token && !isAuthenticated) {
      router.replace(memberPaths(roleParam).signin);
      return;
    }
    if (user?.role && user.role !== roleParam) {
      router.replace(memberPaths(user.role as MemberRole).dashboard);
    }
  }, [roleParam, user?.role, isAuthenticated, router]);

  if (!isMemberRole(roleParam)) {
    return <div className="neo-page min-h-screen" />;
  }

  if (user?.role && user.role !== roleParam) {
    return <div className="neo-page min-h-screen" />;
  }

  return <>{children}</>;
}
