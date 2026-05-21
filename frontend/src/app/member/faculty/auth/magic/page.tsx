import { Suspense } from 'react';
import { MemberMagicPage } from '@/member/pages/MemberMagicPage';

export default function Page() {
  return (
    <Suspense fallback={<p className="neo-page p-8 text-center">Loading…</p>}>
      <MemberMagicPage role="faculty" />
    </Suspense>
  );
}
