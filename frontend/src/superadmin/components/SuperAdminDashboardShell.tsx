'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, LayoutDashboard, User, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/superadmin/store/auth.store';
import { ProtectedRoute } from '@/superadmin/components/ProtectedRoute';
import { SuperAdminAvatar } from '@/superadmin/components/SuperAdminAvatar';
import { PremiumDashboardFrame } from '@/components/dashboard/PremiumDashboardFrame';
import {
  superAdminApi,
  PlatformAdminApproval,
  InstitutionAdminApproval,
} from '@/lib/superadmin-api';
import { membersApi, type BulkUploadSummary } from '@/lib/members-api';
import {
  SA_THEMES,
  SaThemeId,
  applySaTheme,
  getStoredSaTheme,
} from '@/superadmin/lib/sa-theme';
import { useDashboardNotifications } from '@/lib/use-dashboard-notifications';

const NAV = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/profile', label: 'Profile', icon: User },
  { href: '/superadmin/add-members', label: 'Add members', icon: UserPlus },
  { href: '/superadmin/tenant', label: 'Tenant', icon: Building2 },
] as const;

export type SuperAdminNotification = {
  id: string;
  type:
    | 'platform_admin_approval'
    | 'institution_admin_approval'
    | 'student_bulk_upload'
    | 'info';
  title: string;
  message: string;
  requestId?: string;
  createdAt: string;
};

export function SuperAdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hydrateFromStorage, isAuthenticated } = useAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<SaThemeId>('light');
  const [profileName, setProfileName] = useState('');
  const [platformPending, setPlatformPending] = useState<PlatformAdminApproval[]>([]);
  const [institutionPending, setInstitutionPending] = useState<InstitutionAdminApproval[]>([]);
  const [bulkUploads, setBulkUploads] = useState<BulkUploadSummary[]>([]);

  const loadApprovals = useCallback(() => {
    superAdminApi.listPlatformAdminApprovals().then(({ data }) => setPlatformPending(data)).catch(() => {});
    superAdminApi
      .listInstitutionAdminApprovals()
      .then(({ data }) => setInstitutionPending(data))
      .catch(() => {});
    membersApi.listRecentBulkUploads().then(({ data }) => setBulkUploads(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = getStoredSaTheme();
    setTheme(t);
    applySaTheme(t);
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token && !isAuthenticated) {
      router.replace('/superadmin/auth/signin');
    }
  }, [isAuthenticated, router, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) return;
    loadApprovals();
    superAdminApi
      .getProfile()
      .then(({ data }) => setProfileName(data.fullName))
      .catch(() => {});
    const onRefresh = () => {
      loadApprovals();
      superAdminApi.getProfile().then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    };
    window.addEventListener('sa-approvals-refresh', onRefresh);
    window.addEventListener('member-bulk-upload-complete', onRefresh);
    return () => {
      window.removeEventListener('sa-approvals-refresh', onRefresh);
      window.removeEventListener('member-bulk-upload-complete', onRefresh);
    };
  }, [loadApprovals, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('accessToken')) {
      loadApprovals();
    }
  }, [pathname, loadApprovals, isAuthenticated]);

  const notifications = useMemo<SuperAdminNotification[]>(() => {
    const list: SuperAdminNotification[] = [];
    bulkUploads.forEach((job) => {
      const failed = job.failed ?? Math.max(0, job.total_rows - job.succeeded);
      list.push({
        id: `bulk-${job.id}`,
        type: 'student_bulk_upload',
        title:
          job.succeeded > 0
            ? 'Student bulk upload complete'
            : 'Student bulk upload — no new imports',
        message:
          job.succeeded > 0
            ? `${job.succeeded} students imported${job.tenant_name ? ` · ${job.tenant_name}` : ''} — view credentials`
            : `${failed} row(s) failed${job.tenant_name ? ` · ${job.tenant_name}` : ''} — view details`,
        requestId: job.id,
        createdAt: job.created_at,
      });
    });
    platformPending.forEach((req) => {
      list.push({
        id: `pa-${req.id}`,
        type: 'platform_admin_approval',
        title: 'Platform admin approval',
        message: `${req.platform_admin.full_name} (${req.platform_admin.primary_email}) needs approval`,
        requestId: req.id,
        createdAt: new Date().toISOString(),
      });
    });
    institutionPending.forEach((req) => {
      list.push({
        id: `ia-${req.id}`,
        type: 'institution_admin_approval',
        title: 'Institution admin approval',
        message: `${req.institution_admin.full_name} (${req.institution_admin.primary_email}) needs approval`,
        requestId: req.id,
        createdAt: new Date().toISOString(),
      });
    });
    if (list.length === 0) {
      list.push({
        id: 'info-1',
        type: 'info',
        title: 'Platform healthy',
        message: 'No pending approval requests right now.',
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [platformPending, institutionPending, bulkUploads]);

  const { unreadCount, handleNotificationsOpen, handleNotificationClick } =
    useDashboardNotifications('super_admin', notifications);

  const displayName = profileName || (user?.email?.split('@')[0] ?? 'Admin');
  const displayEmail = user?.email ?? '';

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && pathname === '/superadmin/add-members') {
      document.getElementById(`approval-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, pathname]);

  return (
    <ProtectedRoute>
      <PremiumDashboardFrame
        portalLabel="Super Admin"
        displayName={displayName}
        displayEmail={displayEmail}
        avatar={<SuperAdminAvatar userId={user?.userId} name={displayName} size="lg" ring />}
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
              router.push(`/superadmin/add-members?bulkUpload=${n.requestId}`);
            } else if (n.type === 'platform_admin_approval' || n.type === 'institution_admin_approval') {
              const q = n.requestId ? `?highlight=${n.requestId}` : '';
              router.push(`/superadmin/add-members${q}`);
            }
          });
        }}
        onLogout={() => {
          logout();
          router.replace('/superadmin/auth/signin');
        }}
        themes={SA_THEMES}
        theme={theme}
        onThemeChange={(id) => {
          setTheme(id as SaThemeId);
          applySaTheme(id as SaThemeId);
        }}
        notificationActionLabel="Open in Add members →"
      >
        {children}
      </PremiumDashboardFrame>
    </ProtectedRoute>
  );
}

export function useSuperAdminApprovalsRefresh() {
  return () => {
    window.dispatchEvent(new CustomEvent('sa-approvals-refresh'));
  };
}
