import { Suspense } from 'react';
import { InstitutionAdminDashboardShell } from '@/institution-admin/components/InstitutionAdminDashboardShell';

export default function InstitutionAdminProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="neo-page min-h-screen" />}>
      <InstitutionAdminDashboardShell>{children}</InstitutionAdminDashboardShell>
    </Suspense>
  );
}
