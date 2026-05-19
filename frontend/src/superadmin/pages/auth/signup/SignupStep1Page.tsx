'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
import { apiClient } from '@/superadmin/lib/axios'

const SignupStep1Schema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  primaryEmail: z.string().email('Invalid email address'),
  primaryPhoneNumber: z.string().regex(/^\+91\d{10}$|^\d{10}$/, 'Invalid phone number'),
})

type SignupStep1Data = z.infer<typeof SignupStep1Schema>

export function SignupStep1Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupStep1Data>({
    resolver: zodResolver(SignupStep1Schema),
  })

  const onSubmit = async (data: SignupStep1Data) => {
    try {
      setIsLoading(true)

      const initResponse = await apiClient.post('/api/auth/signup/initialize')
      const newSessionId = initResponse.data.sessionId

      sessionStorage.setItem('signupSessionId', newSessionId)
      sessionStorage.setItem('signupData', JSON.stringify(data))

      await apiClient.post(`/api/auth/signup/step-progress/${newSessionId}/1`)

      toast.success('Step 1 completed!')
      router.push(`/superadmin/auth/signup?sessionId=${newSessionId}`)
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || 'Failed to proceed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="neo-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="neo-card w-full max-w-md p-8 sm:p-10">
        <p className="neo-kicker mb-2">Super Admin Signup</p>
        <h1 className="neo-heading mb-2">Basic information</h1>
        <p className="mb-6 text-center text-sm text-[var(--neo-muted)]">Step 1 of 14</p>

        <div className="neo-inset mb-8 h-2 overflow-hidden rounded-full p-0">
          <div className="h-full w-[7%] rounded-full bg-gradient-to-r from-[var(--neo-primary)] to-[var(--neo-primary-light)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="neo-label">Full name</label>
            <div className="neo-inset px-4 py-1">
              <input
                {...register('fullName')}
                className="neo-input-reset py-3"
                placeholder="As on official ID"
                disabled={isLoading}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="neo-label">Primary email</label>
            <div className="neo-inset px-4 py-1">
              <input
                {...register('primaryEmail')}
                type="email"
                className="neo-input-reset py-3"
                placeholder="you@company.com"
                disabled={isLoading}
              />
            </div>
            {errors.primaryEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryEmail.message}</p>
            )}
          </div>

          <div>
            <label className="neo-label">Primary phone</label>
            <div className="neo-inset px-4 py-1">
              <input
                {...register('primaryPhoneNumber')}
                type="tel"
                className="neo-input-reset py-3"
                placeholder="10-digit or +91XXXXXXXXXX"
                disabled={isLoading}
              />
            </div>
            {errors.primaryPhoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryPhoneNumber.message}</p>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="neo-btn-primary w-full py-3.5 text-base">
            {isLoading ? 'Processing…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--neo-muted)]">
          Already have an account?{' '}
          <Link href="/" className="neo-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
