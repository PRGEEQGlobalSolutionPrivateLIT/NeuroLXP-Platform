const AVATAR_PREFIX = 'saProfilePhoto_';

export function avatarStorageKey(userId?: string | null) {
  return userId ? `${AVATAR_PREFIX}${userId}` : `${AVATAR_PREFIX}default`;
}

export function getStoredAvatar(userId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(avatarStorageKey(userId));
}

export function setStoredAvatar(userId: string | null | undefined, dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  const key = avatarStorageKey(userId);
  if (dataUrl) localStorage.setItem(key, dataUrl);
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('sa-avatar-updated'));
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
