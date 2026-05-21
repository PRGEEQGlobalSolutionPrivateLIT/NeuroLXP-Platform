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

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (isAuthenticated, user, accessToken, refreshToken) => {
    set({ isAuthenticated, user, accessToken, refreshToken });
    if (isAuthenticated && accessToken && refreshToken) {
      localStorage.setItem('platformAccessToken', accessToken);
      localStorage.setItem('platformRefreshToken', refreshToken);
      if (user) localStorage.setItem('platformUser', JSON.stringify(user));
    }
  },

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem('platformAccessToken');
    const refreshToken = localStorage.getItem('platformRefreshToken');
    const userRaw = localStorage.getItem('platformUser');
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
    localStorage.removeItem('platformAccessToken');
    localStorage.removeItem('platformRefreshToken');
    localStorage.removeItem('platformUser');
  },
}));
