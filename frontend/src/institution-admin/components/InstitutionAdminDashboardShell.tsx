'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, User, UserPlus } from 'lucide-react';
import { useInstitutionAuthStore } from '@/institution-admin/store/auth.store';
import { InstitutionAdminAvatar } from '@/institution-admin/components/InstitutionAdminAvatar';
import { PremiumDashboardFrame } from '@/components/dashboard/PremiumDashboardFrame';
import { institutionAdminApi } from '@/lib/institution-admin-api';
import { membersApi } from '@/lib/members-api';
import { IA_THEMES, IaThemeId, applyIaTheme, getStoredIaTheme } from '@/institution-admin/lib/ia-theme';

const NAV = [
  { href: '/institution-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/institution-admin/profile', label: 'Profile', icon: User },
  { href: '/institution-admin/add-members', label: 'Add members', icon: UserPlus },
] as const;

export function InstitutionAdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hydrateFromStorage, isAuthenticated } = useInstitutionAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<IaThemeId>('light');
  const [profileName, setProfileName] = useState('');
  const [memberPending, setMemberPending] = useState<
    { id: string; member: { full_name: string; email: string; role: string } }[]
  >([]);

  const loadApprovals = useCallback(() => {
    membersApi.listPendingApprovals('institution_admin').then(({ data }) => setMemberPending(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setTheme(getStoredIaTheme());
    applyIaTheme(getStoredIaTheme());
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    if (!localStorage.getItem('institutionAccessToken') && !isAuthenticated) {
      router.replace('/institution-admin/auth/signin');
    }
  }, [isAuthenticated, router, hydrateFromStorage]);

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('institutionAccessToken')) return;
    loadApprovals();
    institutionAdminApi.getProfile().then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    const onRefresh = () => {
      loadApprovals();
      institutionAdminApi.getProfile().then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    };
    window.addEventListener('ia-approvals-refresh', onRefresh);
    return () => window.removeEventListener('ia-approvals-refresh', onRefresh);
  }, [loadApprovals, isAuthenticated]);

  const notifications = useMemo(() => {
    const list = memberPending.map((req) => ({
      id: `m-${req.id}`,
      type: 'member_approval',
      title: `${req.member.role} sign-in approval`,
      message: `${req.member.full_name} (${req.member.email}) needs approval`,
      requestId: req.id,
    }));
    if (!list.length) {
      list.push({ id: 'info-1', type: 'info', title: 'All clear', message: 'No pending approvals.' });
    }
    return list;
  }, [memberPending]);

  const displayName = profileName || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && pathname === '/institution-admin/add-members') {
      document.getElementById(`approval-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, pathname]);

  return (
    <PremiumDashboardFrame
      portalLabel="Institution Admin"
      displayName={displayName}
      displayEmail={user?.email ?? ''}
      avatar={<InstitutionAdminAvatar userId={user?.userId} name={displayName} size="lg" ring />}
      nav={[...NAV]}
      pathname={pathname}
      approvalCount={memberPending.length}
      notifications={notifications}
      notificationsOpen={notificationsOpen}
      settingsOpen={settingsOpen}
      onNotificationsOpen={setNotificationsOpen}
      onSettingsOpen={setSettingsOpen}
      onNotificationClick={(n) => {
        setNotificationsOpen(false);
        if (n.type !== 'info' && n.requestId) {
          router.push(`/institution-admin/add-members?highlight=${n.requestId}`);
        }
      }}
      onLogout={() => {
        logout();
        router.replace('/institution-admin/auth/signin');
      }}
      themes={IA_THEMES}
      theme={theme}
      onThemeChange={(id) => {
        setTheme(id as IaThemeId);
        applyIaTheme(id as IaThemeId);
      }}
      notificationActionLabel="Open in Add members →"
    >
      {children}
    </PremiumDashboardFrame>
  );
}
