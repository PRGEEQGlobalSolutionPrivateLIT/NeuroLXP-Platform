import { Suspense } from 'react';
import { PlatformAdminMagicPage } from '@/platform-admin/pages/PlatformAdminMagicPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="neo-page flex min-h-screen items-center justify-center">Loading…</div>}>
      <PlatformAdminMagicPage />
    </Suspense>
  );
}
