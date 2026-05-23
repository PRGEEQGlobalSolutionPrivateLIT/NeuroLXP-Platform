export type NotificationPortal =
  | 'platform_admin'
  | 'super_admin'
  | 'institution_admin'
  | 'member';

function storageKey(portal: NotificationPortal) {
  return `neurolxp-${portal}-read-notifications`;
}

export function getReadNotificationIds(portal: NotificationPortal): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey(portal));
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function markNotificationsRead(portal: NotificationPortal, ids: string[]) {
  if (typeof window === 'undefined' || !ids.length) return;
  const current = getReadNotificationIds(portal);
  ids.forEach((id) => current.add(id));
  try {
    localStorage.setItem(storageKey(portal), JSON.stringify([...current]));
  } catch {
    /* ignore quota */
  }
}

export function countUnreadNotifications(
  portal: NotificationPortal,
  notifications: { id: string; type: string }[],
): number {
  const read = getReadNotificationIds(portal);
  return notifications.filter((n) => n.type !== 'info' && !read.has(n.id)).length;
}
