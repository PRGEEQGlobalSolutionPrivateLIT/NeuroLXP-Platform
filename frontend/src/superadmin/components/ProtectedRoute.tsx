'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/superadmin/store/auth.store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, hydrateFromStorage } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    hydrateFromStorage()
    const token = localStorage.getItem('accessToken')

    if (!token && !isAuthenticated) {
      router.replace('/superadmin/auth/signin')
    }

    setIsLoading(false)
  }, [isAuthenticated, router, hydrateFromStorage])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
