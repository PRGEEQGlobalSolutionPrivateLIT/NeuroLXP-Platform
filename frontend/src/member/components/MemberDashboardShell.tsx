'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, User, UserCheck } from 'lucide-react';
import { MemberRole } from '@/lib/members-api';
import { membersApi } from '@/lib/members-api';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { MemberAvatar } from '@/member/components/MemberAvatar';
import { PremiumDashboardFrame } from '@/components/dashboard/PremiumDashboardFrame';
import {
  memberPaths,
  MEMBER_ROLE_LABELS,
  defaultMemberSigninPath,
  isMemberRole,
} from '@/member/lib/member-routes';
import {
  MEMBER_THEMES,
  MemberThemeId,
  applyMemberTheme,
  getStoredMemberTheme,
} from '@/member/lib/member-theme';

function navForRole(role: MemberRole) {
  const paths = memberPaths(role);
  const items = [
    { href: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { href: paths.profile, label: 'Profile', icon: User },
  ];
  if (role === 'coordinator') {
    items.push({ href: paths.approvals, label: 'Approvals', icon: UserCheck });
  }
  return items;
}

export function MemberDashboardShell({
  children,
  roleFromUrl,
}: {
  children: ReactNode;
  roleFromUrl?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, hydrateFromStorage, isAuthenticated } = useMemberAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<MemberThemeId>('light');
  const [profileName, setProfileName] = useState('');
  const [pending, setPending] = useState<
    { id: string; member: { full_name: string; email: string; role: string } }[]
  >([]);

  const role = user?.role ?? (roleFromUrl && isMemberRole(roleFromUrl) ? roleFromUrl : undefined);

  const loadApprovals = useCallback(() => {
    if (role !== 'coordinator') {
      setPending([]);
      return;
    }
    membersApi.listPendingApprovals('coordinator').then(({ data }) => setPending(data)).catch(() => {});
  }, [role]);

  useEffect(() => {
    setTheme(getStoredMemberTheme());
    applyMemberTheme(getStoredMemberTheme());
  }, []);

  useEffect(() => {
    hydrateFromStorage();
    if (!localStorage.getItem('memberAccessToken') && !isAuthenticated) {
      router.replace(defaultMemberSigninPath());
    }
  }, [isAuthenticated, router, hydrateFromStorage]);

  useEffect(() => {
    if (!user?.memberId) return;
    membersApi.getProfile(user.memberId).then(({ data }) => setProfileName(data.fullName)).catch(() => {});
    loadApprovals();
    const onRefresh = () => {
      loadApprovals();
      if (user.memberId) {
        membersApi.getProfile(user.memberId).then(({ data }) => setProfileName(data.fullName)).catch(() => {});
      }
    };
    window.addEventListener('member-portal-refresh', onRefresh);
    return () => window.removeEventListener('member-portal-refresh', onRefresh);
  }, [user?.memberId, loadApprovals]);

  const notifications = useMemo(() => {
    if (role !== 'coordinator') {
      return [{ id: 'info', type: 'info', title: 'All caught up', message: 'No pending actions.' }];
    }
    const list = pending.map((req) => ({
      id: req.id,
      type: 'member_approval',
      title: `${req.member.role} sign-in`,
      message: `${req.member.full_name} (${req.member.email}) needs approval`,
      requestId: req.id,
    }));
    if (!list.length) {
      list.push({ id: 'info', type: 'info', title: 'All clear', message: 'No pending approvals.' });
    }
    return list;
  }, [pending, role]);

  const displayName = profileName || user?.fullName || user?.email?.split('@')[0] || 'Member';

  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight && pathname.endsWith('/approvals')) {
      document.getElementById(`approval-${highlight}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, pathname]);

  if (!role) return <div className="neo-page min-h-screen" />;

  return (
    <PremiumDashboardFrame
      portalLabel={MEMBER_ROLE_LABELS[role]}
      displayName={displayName}
      displayEmail={user?.email ?? ''}
      avatar={<MemberAvatar memberId={user?.memberId} name={displayName} size="lg" ring />}
      nav={navForRole(role)}
      pathname={pathname}
      approvalCount={role === 'coordinator' ? pending.length : 0}
      notifications={notifications}
      notificationsOpen={notificationsOpen}
      settingsOpen={settingsOpen}
      onNotificationsOpen={setNotificationsOpen}
      onSettingsOpen={setSettingsOpen}
      onNotificationClick={(n) => {
        setNotificationsOpen(false);
        if (n.type !== 'info' && n.requestId) {
          router.push(`${memberPaths(role).approvals}?highlight=${n.requestId}`);
        }
      }}
      onLogout={() => {
        logout();
        router.replace(memberPaths(role).signin);
      }}
      themes={MEMBER_THEMES}
      theme={theme}
      onThemeChange={(id) => {
        setTheme(id as MemberThemeId);
        applyMemberTheme(id as MemberThemeId);
      }}
      notificationActionLabel="Open in Approvals →"
    >
      {children}
    </PremiumDashboardFrame>
  );
}
