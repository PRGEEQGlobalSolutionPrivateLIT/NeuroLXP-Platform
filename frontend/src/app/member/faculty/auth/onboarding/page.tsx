import { Suspense } from 'react';
import { MemberOnboardingPage } from '@/member/pages/MemberOnboardingPage';

export default function Page() {
  return (
    <Suspense fallback={<p className="neo-page p-8 text-center">Loading…</p>}>
      <MemberOnboardingPage role="faculty" />
    </Suspense>
  );
}
