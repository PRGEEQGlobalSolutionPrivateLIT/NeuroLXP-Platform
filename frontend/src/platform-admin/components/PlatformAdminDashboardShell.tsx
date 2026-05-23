'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, LayoutDashboard, User, UserPlus } from 'lucide-react';
import { usePlatformAuthStore } from '@/platform-admin/store/auth.store';
import { PlatformAdminAvatar } from '@/platform-admin/components/PlatformAdminAvatar';
import { PremiumDashboardFrame } from '@/components/dashboard/PremiumDashboardFrame';
import { platformAdminApi } from '@/lib/platform-admin-api';
import { membersApi, type BulkUploadSummary } from '@/lib/members-api';
import { PA_THEMES, PaThemeId, applyPaTheme, getStoredPaTheme } from '@/platform-admin/lib/pa-theme';
import { useDashboardNotifications } from '@/lib/use-dashboard-notifications';

const NAV = [
  { href: '/platform-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/platform-admin/profile', label: 'Profile', icon: User },
  { href: '/platform-admin/add-members', label: 'Add members', icon: UserPlus },
  { href: '/platform-admin/tenant', label: 'Tenant', icon: Building2 },
] as const;

export function PlatformAdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hydrateFromStorage, isAuthenticated } = usePlatformAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<PaThemeId>('light');
  const [profileName, setProfileName] = useState('');
  const [institutionPending, setInstitutionPending] = useState<
    { id: string; institution_admin: { full_name: string; primary_email: string } }[]
  >([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUploadSummary[]>([]);

  const loadApprovals = useCallback(() => {
    platformAdminApi.listInstitutionPendingApprovals().then(({ data }) => setInstitutionPending(data)).catch(() => {});
    membersApi.listRecentBulkUploads().then(({ data }) => setBulkUploads(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setTheme(getStoredPaTheme());
    applyPaTheme(getStoredPaTheme());
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    if (!localStorage.getItem('platformAccessToken') && !isAuthenticated) {
      router.replace('/platform-admin/auth/signin');
    }
  }, [isAuthenticated, router, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('platformAccessToken')) return;
    loadApprovals();
    platformAdminApi.getProfile().then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    const onRefresh = () => {
      loadApprovals();
      platformAdminApi.getProfile().then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    };
    window.addEventListener('pa-approvals-refresh', onRefresh);
    window.addEventListener('member-bulk-upload-complete', onRefresh);
    return () => {
      window.removeEventListener('pa-approvals-refresh', onRefresh);
      window.removeEventListener('member-bulk-upload-complete', onRefresh);
    };
  }, [loadApprovals, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('platformAccessToken')) {
      loadApprovals();
    }
  }, [pathname, loadApprovals, isAuthenticated]);

  const notifications = useMemo(() => {
    const list = bulkUploads.map((job) => ({
      id: `bulk-${job.id}`,
      type: 'student_bulk_upload',
      title: 'Student bulk upload complete',
      message: `${job.succeeded} students imported${job.tenant_name ? ` · ${job.tenant_name}` : ''} — view credentials`,
      requestId: job.id,
    }));
    institutionPending.forEach((req) => {
      list.push({
        id: `ia-${req.id}`,
        type: 'institution_admin_approval',
        title: 'Institution admin approval',
        message: `${req.institution_admin.full_name} (${req.institution_admin.primary_email}) needs approval`,
        requestId: req.id,
      });
    });
    if (!list.length) {
      list.push({ id: 'info-1', type: 'info', title: 'All clear', message: 'No pending items.' });
    }
    return list;
  }, [institutionPending, bulkUploads]);

  const { unreadCount, handleNotificationsOpen, handleNotificationClick } =
    useDashboardNotifications('platform_admin', notifications);

  const displayName = profileName || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && pathname === '/platform-admin/add-members') {
      document.getElementById(`approval-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, pathname]);

  return (
    <PremiumDashboardFrame
      portalLabel="Platform Admin"
      displayName={displayName}
      displayEmail={user?.email ?? ''}
      avatar={<PlatformAdminAvatar userId={user?.userId} name={displayName} size="lg" ring />}
      nav={[...NAV]}
      pathname={pathname}
      approvalCount={unreadCount}
      notifications={notifications}
      notificationsOpen={notificationsOpen}
      settingsOpen={settingsOpen}
      onNotificationsOpen={(open) => handleNotificationsOpen(open, setNotificationsOpen)}
      onSettingsOpen={setSettingsOpen}
      onNotificationClick={(n) => {
        handleNotificationClick(n.id, () => {
          setNotificationsOpen(false);
          if (n.type === 'student_bulk_upload' && n.requestId) {
            router.push(`/platform-admin/add-members?bulkUpload=${n.requestId}`);
          } else if (n.type !== 'info' && n.requestId) {
            router.push(`/platform-admin/add-members?highlight=${n.requestId}`);
          }
        });
      }}
      onLogout={() => {
        logout();
        router.replace('/platform-admin/auth/signin');
      }}
      themes={PA_THEMES}
      theme={theme}
      onThemeChange={(id) => {
        setTheme(id as PaThemeId);
        applyPaTheme(id as PaThemeId);
      }}
      notificationActionLabel="Open in Add members →"
    >
      {children}
    </PremiumDashboardFrame>
  );
}

export function usePlatformAdminApprovalsRefresh() {
  return () => window.dispatchEvent(new CustomEvent('pa-approvals-refresh'));
}
