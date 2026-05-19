'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { apiClient } from '@/superadmin/lib/axios'
import { useAuthStore } from '@/superadmin/store/auth.store'

const RECOVERY_STEPS = [
  { number: 2, title: 'OTP Delivery Method' },
  { number: 3, title: 'Verify OTP' },
  { number: 4, title: 'Google Authenticator' },
  { number: 5, title: 'Recovery Code' },
  { number: 6, title: 'Backup Code' },
  { number: 7, title: 'Security Question' },
  { number: 8, title: 'Government ID' },
  { number: 9, title: 'Secondary Approval' },
]

export function SigninRecoveryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)

  const sessionId = searchParams.get('sessionId')
  const initialStep = parseInt(searchParams.get('step') || '2', 10)
  const initialSuperAdminId = searchParams.get('superAdminId')

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [superAdminId, setSuperAdminId] = useState<string>(initialSuperAdminId || '')
  const [securityQuestion, setSecurityQuestion] = useState<string>('')
  const [input, setInput] = useState('')
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone'>('email')
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 5

  useEffect(() => {
    if (initialSuperAdminId) {
      setSuperAdminId(initialSuperAdminId)
      sessionStorage.setItem('superAdminId', initialSuperAdminId)
    } else {
      const storedSuperAdminId = sessionStorage.getItem('superAdminId')
      if (storedSuperAdminId) {
        setSuperAdminId(storedSuperAdminId)
      }
    }
  }, [initialSuperAdminId])

  useEffect(() => {
    if (currentStep === 7 && superAdminId) {
      apiClient
        .get(`/api/auth/signin/security-question/${superAdminId}`)
        .then((response) => setSecurityQuestion(response.data.question))
        .catch(() => setSecurityQuestion('Please answer your security question'))
    }
  }, [currentStep, superAdminId])

  if (!sessionId) {
    return (
      <div className="neo-page flex min-h-screen items-center justify-center px-4">
        <div className="neo-card max-w-md p-8 text-center">
          <p className="font-semibold text-red-600">Invalid session</p>
          <p className="mt-2 text-sm text-[var(--neo-muted)]">Please sign in again.</p>
          <a href="/" className="neo-btn-primary mt-6 inline-block px-6 py-3 text-sm">
            Back to Sign In
          </a>
        </div>
      </div>
    )
  }

  const completeLogin = async () => {
    const loginResponse = await apiClient.post(
      `/api/auth/signin/complete/${sessionId}/${superAdminId}`,
    )

    setAuth(
      true,
      { userId: loginResponse.data.userId, email: loginResponse.data.email },
      loginResponse.data.accessToken,
      loginResponse.data.refreshToken,
    )

    toast.success('Logged in successfully!')
    router.push('/superadmin/dashboard')
  }

  const handleStepVerification = async () => {
    const stepsWithoutInput = [2, 9]
    if (!stepsWithoutInput.includes(currentStep) && !input.trim()) {
      toast.error('Please enter the required information')
      return
    }

    try {
      setIsLoading(true)

      let endpoint = ''
      let payload: any = {}

      switch (currentStep) {
        case 2:
          endpoint = `/api/auth/signin/select-otp-method/${sessionId}`
          payload = { method: otpMethod }
          break
        case 3:
          endpoint = `/api/auth/signin/verify-otp/${sessionId}`
          payload = { otp: input }
          break
        case 4:
          endpoint = `/api/auth/signin/verify-authenticator/${sessionId}/${superAdminId}`
          payload = { code: input }
          break
        case 5:
          endpoint = `/api/auth/signin/verify-recovery-code/${sessionId}/${superAdminId}`
          payload = { recoveryCode: input }
          break
        case 6:
          endpoint = `/api/auth/signin/verify-backup-code/${sessionId}/${superAdminId}`
          payload = { backupCode: input }
          break
        case 7:
          endpoint = `/api/auth/signin/verify-security-question/${sessionId}/${superAdminId}`
          payload = { answer: input }
          break
        case 8:
          endpoint = `/api/auth/signin/verify-government-id/${sessionId}/${superAdminId}`
          payload = { governmentIdNumber: input }
          break
        case 9:
          endpoint = `/api/auth/signin/request-approval/${sessionId}/${superAdminId}`
          break
        default:
          break
      }

      if (endpoint) {
        const response = await apiClient.post(endpoint, payload)

        if (currentStep === 9) {
          // Approval requested - wait for approval code
          const approvalCode = prompt('Enter the approval code sent to secondary approver:')
          if (approvalCode) {
            const verifyResponse = await apiClient.post(
              `/api/auth/signin/verify-approval/${sessionId}/${superAdminId}`,
              { approvalCode },
            )

            if (verifyResponse.data.isApproved) {
              await completeLogin()
            }
          }
        } else if (response.data.nextStep) {
          const nextStep = response.data.nextStep as number
          if (nextStep > 9) {
            await completeLogin()
          } else {
            setCurrentStep(nextStep)
            setInput('')
            toast.success('Step completed! Moving to next verification.')
          }
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed'
      toast.error(message)

      // Update attempts
      if (error.response?.status === 401) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Select OTP Delivery Method</h2>
            <p className="text-sm text-[var(--neo-muted)]">How would you like to receive your OTP?</p>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-[var(--neo-radius-md)] p-4 transition ${
                  otpMethod === 'email' ? 'neo-pill-active' : 'neo-raised'
                }`}
                onClick={() => setOtpMethod('email')}
              >
                <input
                  type="radio"
                  checked={otpMethod === 'email'}
                  onChange={() => setOtpMethod('email')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Email</span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-[var(--neo-radius-md)] p-4 transition ${
                  otpMethod === 'phone' ? 'neo-pill-active' : 'neo-raised'
                }`}
                onClick={() => setOtpMethod('phone')}
              >
                <input
                  type="radio"
                  checked={otpMethod === 'phone'}
                  onChange={() => setOtpMethod('phone')}
                  className="h-4 w-4"
                />
                <span className="font-medium">Phone</span>
              </label>
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading}
              className="neo-btn-primary w-full py-3.5"
            >
              Send OTP
            </button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Verify OTP</h2>
            <p className="text-sm text-[var(--neo-muted)]">Enter the 6-digit OTP sent to you</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="neo-input-reset w-full py-2 text-center font-mono text-2xl"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-[var(--neo-muted)]">Attempts remaining: {maxAttempts - attempts}/5</p>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || input.length !== 6}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify OTP
            </button>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Google Authenticator Code</h2>
            <p className="text-sm text-[var(--neo-muted)]">Enter the 6-digit code from your authenticator app</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="neo-input-reset w-full py-2 text-center font-mono text-2xl"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || input.length !== 6}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify Code
            </button>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Recovery Code</h2>
            <p className="text-sm text-[var(--neo-muted)]">Enter your recovery code</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="RECOVERY-CODE-XXXXX"
                className="neo-input-reset w-full py-3 font-mono"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || !input}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify Recovery Code
            </button>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Backup Code</h2>
            <p className="text-sm text-[var(--neo-muted)]">Enter any one of your unused backup codes</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="BACKUP-CODE-XX"
                maxLength={8}
                className="neo-input-reset w-full py-3 font-mono"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || input.length !== 8}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify Backup Code
            </button>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Security Question</h2>
            <p className="text-sm text-[var(--neo-muted)]">{securityQuestion}</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your answer"
                className="neo-input-reset w-full py-3"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-[var(--neo-muted)]">Attempts remaining: {maxAttempts - attempts}/2</p>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || !input}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify Answer
            </button>
          </div>
        )

      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Government ID Verification</h2>
            <p className="text-sm text-[var(--neo-muted)]">Enter your government ID number</p>
            <div className="neo-inset px-4 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your ID number"
                className="neo-input-reset w-full py-3"
                disabled={isLoading}
              />
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading || !input}
              className="neo-btn-primary w-full py-3.5"
            >
              Verify ID
            </button>
          </div>
        )

      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--neo-text)]">Secondary Approver Authorization</h2>
            <p className="text-sm text-[var(--neo-muted)]">Request approval from your secondary approver</p>
            <div className="neo-inset space-y-2 rounded-[var(--neo-radius-md)] p-4 text-sm text-[var(--neo-text)]">
              <p>
                <strong>Approver Name:</strong> John Doe
              </p>
              <p>
                <strong>Designation:</strong> Manager
              </p>
              <p>
                <strong>Email:</strong> john@company.com
              </p>
            </div>
            <button
              type="button"
              onClick={handleStepVerification}
              disabled={isLoading}
              className="neo-btn-primary w-full py-3.5"
            >
              Send Approval Request
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="neo-page min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="neo-kicker mb-2">Super Admin</p>
        <h1 className="neo-heading mb-8">Multi-factor verification</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="neo-card p-5 lg:sticky lg:top-8">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[var(--neo-muted)]">
                Recovery steps
              </h3>
              <div className="space-y-2">
                {RECOVERY_STEPS.map((step) => (
                  <div
                    key={step.number}
                    className={`rounded-[var(--neo-radius-md)] px-3 py-2.5 text-sm font-semibold transition ${
                      currentStep === step.number
                        ? 'neo-pill-active'
                        : currentStep > step.number
                          ? 'neo-raised text-emerald-800'
                          : 'neo-raised text-[var(--neo-muted)]'
                    }`}
                  >
                    {step.title}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <div className="neo-card p-6 sm:p-8">
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-[var(--neo-text)] sm:text-2xl">Secure sign-in</h2>
                  <span className="text-sm font-semibold text-[var(--neo-muted)]">Step {currentStep} of 9</span>
                </div>
                <div className="neo-inset h-2 overflow-hidden rounded-full p-0">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--neo-primary)] to-[var(--neo-primary-light)] transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 8) * 100}%` }}
                  />
                </div>
              </div>

              <div className="min-h-[14rem]">{renderStepContent()}</div>

              <p className="mt-8 text-center text-sm text-[var(--neo-muted)]">
                Having trouble? Contact your administrator ·{' '}
                <a href="/" className="neo-link">
                  Cancel
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
