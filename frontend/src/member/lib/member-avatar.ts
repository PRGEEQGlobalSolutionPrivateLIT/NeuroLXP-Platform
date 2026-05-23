const AVATAR_PREFIX = 'memberProfilePhoto_';

export function memberAvatarStorageKey(memberId?: string | null) {
  return memberId ? `${AVATAR_PREFIX}${memberId}` : `${AVATAR_PREFIX}default`;
}

export function getStoredMemberAvatar(memberId?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(memberAvatarStorageKey(memberId));
}

export function setStoredMemberAvatar(memberId: string | null | undefined, dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  const key = memberAvatarStorageKey(memberId);
  if (dataUrl) localStorage.setItem(key, dataUrl);
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('member-avatar-updated'));
}

export function memberInitialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ME';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
