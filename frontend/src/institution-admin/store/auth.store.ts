import { create } from 'zustand';

interface PlatformAuthState {
  isAuthenticated: boolean;
  user: { userId: string; email: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (
    isAuthenticated: boolean,
    user: { userId: string; email: string } | null,
    accessToken: string | null,
    refreshToken: string | null,
  ) => void;
  hydrateFromStorage: () => void;
  logout: () => void;
}

export const useInstitutionAuthStore = create<PlatformAuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (isAuthenticated, user, accessToken, refreshToken) => {
    set({ isAuthenticated, user, accessToken, refreshToken });
    if (isAuthenticated && accessToken && refreshToken) {
      localStorage.setItem('institutionAccessToken', accessToken);
      localStorage.setItem('institutionRefreshToken', refreshToken);
      if (user) localStorage.setItem('institutionUser', JSON.stringify(user));
    }
  },

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem('institutionAccessToken');
    const refreshToken = localStorage.getItem('institutionRefreshToken');
    const userRaw = localStorage.getItem('institutionUser');
    if (!accessToken || !refreshToken) return;
    try {
      const user = userRaw ? (JSON.parse(userRaw) as { userId: string; email: string }) : null;
      set({ isAuthenticated: true, accessToken, refreshToken, user });
    } catch {
      set({ isAuthenticated: true, accessToken, refreshToken, user: null });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
    localStorage.removeItem('institutionAccessToken');
    localStorage.removeItem('institutionRefreshToken');
    localStorage.removeItem('institutionUser');
  },
}));

