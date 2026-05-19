'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export function SignupSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recoveryCode, setRecoveryCode] = useState('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const code = searchParams.get('recoveryCode')
    if (code) {
      setRecoveryCode(decodeURIComponent(code))
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          router.push('/')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const copyToClipboard = () => {
    if (recoveryCode) {
      void navigator.clipboard.writeText(recoveryCode)
      toast.success('Recovery code copied')
    }
  }

  return (
    <div className="neo-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="neo-card w-full max-w-md p-8 text-center sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
          ✓
        </div>

        <p className="neo-kicker mb-2">Super Admin Signup</p>
        <h1 className="neo-heading mb-2">Account created</h1>
        <p className="mb-8 text-sm text-[var(--neo-muted)]">
          Your Super Admin account has been created successfully.
        </p>

        <div className="neo-inset mb-6 space-y-2 rounded-[var(--neo-radius-md)] p-4 text-left text-sm text-[var(--neo-text)]">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span>
            <span>Password encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span>
            <span>Two-factor enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span>
            <span>Recovery material issued</span>
          </div>
        </div>

        {recoveryCode && (
          <div className="mb-6 text-left">
            <p className="neo-label">Your recovery code</p>
            <div className="neo-inset px-4 py-3">
              <p className="break-all font-mono text-base font-bold text-[var(--neo-text)]">{recoveryCode}</p>
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="neo-btn-raised mt-3 w-full py-3 text-sm"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        <p className="mb-6 text-xs text-[var(--neo-muted)]">
          Store your recovery code somewhere safe. You will need it for account recovery.
        </p>

        <Link href="/" className="neo-btn-primary block w-full py-3.5 text-center text-base">
          Proceed to sign in
        </Link>

        <p className="mt-4 text-xs text-[var(--neo-muted)]">Redirecting in {countdown}s…</p>
      </div>
    </div>
  )
}
