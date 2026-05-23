const AVATAR_PREFIX = 'iaProfilePhoto_';

export function iaAvatarStorageKey(userId?: string | null) {
  return userId ? `${AVATAR_PREFIX}${userId}` : `${AVATAR_PREFIX}default`;
}

export function getStoredIaAvatar(userId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(iaAvatarStorageKey(userId));
}

export function setStoredIaAvatar(userId: string | null | undefined, dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  const key = iaAvatarStorageKey(userId);
  if (dataUrl) localStorage.setItem(key, dataUrl);
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('ia-avatar-updated'));
}

export function iaInitialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'IA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
