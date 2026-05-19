import { Suspense } from 'react'
import { SignupSuccessPage } from '@/superadmin/pages/auth/signup/SignupSuccessPage'

function SuccessFallback() {
  return (
    <div className="neo-page flex min-h-screen items-center justify-center px-4">
      <div className="neo-card p-8 text-center text-sm text-[var(--neo-muted)]">Loading…</div>
    </div>
  )
}

export default function SignupSuccessRoutePage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SignupSuccessPage />
    </Suspense>
  )
}
