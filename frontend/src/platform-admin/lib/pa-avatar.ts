const AVATAR_PREFIX = 'paProfilePhoto_';

export function paAvatarStorageKey(userId?: string | null) {
  return userId ? `${AVATAR_PREFIX}${userId}` : `${AVATAR_PREFIX}default`;
}

export function getStoredPaAvatar(userId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(paAvatarStorageKey(userId));
}

export function setStoredPaAvatar(userId: string | null | undefined, dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  const key = paAvatarStorageKey(userId);
  if (dataUrl) localStorage.setItem(key, dataUrl);
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('pa-avatar-updated'));
}

export function paInitialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
