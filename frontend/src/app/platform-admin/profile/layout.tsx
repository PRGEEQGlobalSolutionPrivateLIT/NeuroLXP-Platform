import { Suspense } from 'react';
import { PlatformAdminDashboardShell } from '@/platform-admin/components/PlatformAdminDashboardShell';

export default function PlatformAdminProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="neo-page min-h-screen" />}>
      <PlatformAdminDashboardShell>{children}</PlatformAdminDashboardShell>
    </Suspense>
  );
}
