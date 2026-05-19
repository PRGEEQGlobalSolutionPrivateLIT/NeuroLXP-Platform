import { Suspense } from 'react'
import { SigninRecoveryPage } from '@/superadmin/pages/auth/signin/SigninRecoveryPage'

function RecoveryFallback() {
  return (
    <div className="neo-page flex min-h-screen items-center justify-center px-4">
      <div className="neo-card p-8 text-center text-sm text-[var(--neo-muted)]">Loading…</div>
    </div>
  )
}

export default function SigninRecoveryRoutePage() {
  return (
    <Suspense fallback={<RecoveryFallback />}>
      <SigninRecoveryPage />
    </Suspense>
  )
}
