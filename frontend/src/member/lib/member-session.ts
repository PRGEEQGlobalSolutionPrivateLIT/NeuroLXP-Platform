import { MemberRole } from '@/lib/members-api';

export type MemberLoginEntry = {
  at: string;
  email: string;
  userId?: string;
  role: MemberRole;
  status: 'success' | 'failed';
  method?: string;
};

const LAST_KEY = 'memberLastLoginAt';
const HISTORY_KEY = 'memberLoginHistory';

export function recordMemberLogin(
  email: string,
  role: MemberRole,
  userId?: string,
  method = 'Sign-in',
) {
  if (typeof window === 'undefined') return;
  const at = new Date().toISOString();
  localStorage.setItem(LAST_KEY, at);
  const prev: MemberLoginEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  prev.unshift({ at, email, userId, role, status: 'success', method });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 30)));
}

export function getMemberLastLogin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_KEY);
}

export function getMemberLoginHistory(): MemberLoginEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as MemberLoginEntry[];
  } catch {
    return [];
  }
}

export function formatMemberDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
