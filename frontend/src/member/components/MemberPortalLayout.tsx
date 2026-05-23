import { ReactNode, Suspense } from 'react';
import { MemberRoleGuard } from '@/member/components/MemberRoleGuard';
import { MemberDashboardShell } from '@/member/components/MemberDashboardShell';

export function MemberPortalLayout({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="neo-page min-h-screen" />}>
      <MemberRoleGuard roleParam={role}>
        <MemberDashboardShell roleFromUrl={role}>{children}</MemberDashboardShell>
      </MemberRoleGuard>
    </Suspense>
  );
}
