export type PaLoginEntry = {
  at: string;
  email: string;
  userId?: string;
  status: 'success' | 'failed';
  method?: string;
};

const LAST_KEY = 'paLastLoginAt';
const HISTORY_KEY = 'paLoginHistory';

export function recordPaLogin(email: string, userId?: string, method = 'Sign-in') {
  if (typeof window === 'undefined') return;
  const at = new Date().toISOString();
  localStorage.setItem(LAST_KEY, at);
  const prev: PaLoginEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  prev.unshift({ at, email, userId, status: 'success', method });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 30)));
}

export function getPaLastLogin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_KEY);
}

export function getPaLoginHistory(): PaLoginEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as PaLoginEntry[];
  } catch {
    return [];
  }
}

export function formatPaDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
