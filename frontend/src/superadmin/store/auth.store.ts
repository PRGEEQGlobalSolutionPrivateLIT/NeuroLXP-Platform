import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  user: {
    userId: string
    email: string
  } | null
  accessToken: string | null
  refreshToken: string | null

  setAuth: (
    isAuthenticated: boolean,
    user: { userId: string; email: string } | null,
    accessToken: string | null,
    refreshToken: string | null,
  ) => void
  hydrateFromStorage: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (isAuthenticated, user, accessToken, refreshToken) => {
    set({ isAuthenticated, user, accessToken, refreshToken })

    if (isAuthenticated && accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }
    }
  },

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const userRaw = localStorage.getItem('user')
    if (!accessToken || !refreshToken) return
    try {
      const user = userRaw ? (JSON.parse(userRaw) as { userId: string; email: string }) : null
      set({ isAuthenticated: true, accessToken, refreshToken, user })
    } catch {
      set({ isAuthenticated: true, accessToken, refreshToken, user: null })
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },
}))
