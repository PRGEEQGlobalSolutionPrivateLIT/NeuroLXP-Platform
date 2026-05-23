import { Suspense } from 'react';
import { SuperAdminDashboardShell } from '@/superadmin/components/SuperAdminDashboardShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="neo-page min-h-screen" />}>
      <SuperAdminDashboardShell>{children}</SuperAdminDashboardShell>
    </Suspense>
  );
}
