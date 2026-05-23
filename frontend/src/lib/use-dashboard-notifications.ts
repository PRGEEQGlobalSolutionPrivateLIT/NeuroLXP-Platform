'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  countUnreadNotifications,
  getReadNotificationIds,
  markNotificationsRead,
  type NotificationPortal,
} from '@/lib/dashboard-notifications-read';

export function useDashboardNotifications(
  portal: NotificationPortal,
  notifications: { id: string; type: string }[],
) {
  const [readTick, setReadTick] = useState(0);

  const readIds = useMemo(() => {
    void readTick;
    return getReadNotificationIds(portal);
  }, [portal, readTick]);

  const unreadCount = useMemo(
    () => countUnreadNotifications(portal, notifications),
    [portal, notifications, readTick],
  );

  const markAsRead = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      markNotificationsRead(portal, ids);
      setReadTick((t) => t + 1);
    },
    [portal],
  );

  const markAllCurrentAsRead = useCallback(() => {
    const ids = notifications.filter((n) => n.type !== 'info').map((n) => n.id);
    markAsRead(ids);
  }, [notifications, markAsRead]);

  const handleNotificationsOpen = useCallback(
    (open: boolean, setOpen: (v: boolean) => void) => {
      setOpen(open);
      if (open) markAllCurrentAsRead();
    },
    [markAllCurrentAsRead],
  );

  const handleNotificationClick = useCallback(
    (notificationId: string, onNavigate: () => void) => {
      markAsRead([notificationId]);
      onNavigate();
    },
    [markAsRead],
  );

  return {
    readIds,
    unreadCount,
    markAsRead,
    markAllCurrentAsRead,
    handleNotificationsOpen,
    handleNotificationClick,
  };
}
