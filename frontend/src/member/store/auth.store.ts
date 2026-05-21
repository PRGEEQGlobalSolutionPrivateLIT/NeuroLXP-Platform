import { create } from 'zustand';
import { MemberRole } from '@/lib/members-api';
import { persistMemberLastRole } from '@/member/lib/member-routes';

interface MemberUser {
  memberId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  userId?: string;
  mustChangePassword: boolean;
}

interface MemberAuthState {
  isAuthenticated: boolean;
  user: MemberUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: MemberUser, accessToken: string, refreshToken: string) => void;
  hydrateFromStorage: () => void;
  logout: () => void;
  setMustChangePassword: (v: boolean) => void;
}

export const useMemberAuthStore = create<MemberAuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  setAuth: (user, accessToken, refreshToken) => {
    set({ isAuthenticated: true, user, accessToken, refreshToken });
    localStorage.setItem('memberAccessToken', accessToken);
    localStorage.setItem('memberRefreshToken', refreshToken);
    localStorage.setItem('memberUser', JSON.stringify(user));
    persistMemberLastRole(user.role);
  },

  hydrateFromStorage: () => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem('memberAccessToken');
    const refreshToken = localStorage.getItem('memberRefreshToken');
    const raw = localStorage.getItem('memberUser');
    if (!accessToken || !raw) return;
    try {
      const user = JSON.parse(raw) as MemberUser;
      set({ isAuthenticated: true, accessToken, refreshToken, user });
    } catch {
      set({ isAuthenticated: true, accessToken, refreshToken, user: null });
    }
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
    localStorage.removeItem('memberAccessToken');
    localStorage.removeItem('memberRefreshToken');
    localStorage.removeItem('memberUser');
  },

  setMustChangePassword: (v) =>
    set((s) => (s.user ? { user: { ...s.user, mustChangePassword: v } } : {})),
}));
