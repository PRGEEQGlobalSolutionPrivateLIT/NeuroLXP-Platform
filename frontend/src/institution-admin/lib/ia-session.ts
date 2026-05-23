export type IaLoginEntry = {
  at: string;
  email: string;
  userId?: string;
  status: 'success' | 'failed';
  method?: string;
};

const LAST_KEY = 'iaLastLoginAt';
const HISTORY_KEY = 'iaLoginHistory';

export function recordIaLogin(email: string, userId?: string, method = 'Sign-in') {
  if (typeof window === 'undefined') return;
  const at = new Date().toISOString();
  localStorage.setItem(LAST_KEY, at);
  const prev: IaLoginEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  prev.unshift({ at, email, userId, status: 'success', method });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 30)));
}

export function getIaLastLogin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_KEY);
}

export function getIaLoginHistory(): IaLoginEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as IaLoginEntry[];
  } catch {
    return [];
  }
}

export function formatIaDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
