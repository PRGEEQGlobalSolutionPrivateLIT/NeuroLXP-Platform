import { Suspense } from 'react';
import { PlatformAdminOnboardingWizard } from '@/platform-admin/pages/PlatformAdminOnboardingWizard';

export default function Page() {
  return (
    <Suspense fallback={<div className="neo-page flex min-h-screen items-center justify-center">Loading…</div>}>
      <PlatformAdminOnboardingWizard />
    </Suspense>
  );
}
