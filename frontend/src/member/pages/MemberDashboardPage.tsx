'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  FileText,
  History,
  LogIn,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  LucideIcon,
} from 'lucide-react';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { MemberRole } from '@/lib/members-api';
import {
  getMemberLastLogin,
  getMemberLoginHistory,
  formatMemberDateTime,
  MemberLoginEntry,
} from '@/member/lib/member-session';
import {
  memberPaths,
  MEMBER_ROLE_LABELS,
  memberRecoveryStorageKey,
  memberUserIdStorageKey,
} from '@/member/lib/member-routes';
import { RecoveryCodeAlertModal } from '@/components/ui/RecoveryCodeAlertModal';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardLoginTable } from '@/components/dashboard/DashboardLoginTable';

type Stat = { label: string; value: string; change: string; icon: LucideIcon };

const STATS_BY_ROLE: Record<MemberRole, Stat[]> = {
  student: [
    { label: 'Courses', value: '6', change: '2 in progress', icon: BookOpen },
    { label: 'Assignments', value: '4', change: 'Due this week', icon: FileText },
    { label: 'Progress', value: '78%', change: '+5% this month', icon: TrendingUp },
    { label: 'Streak', value: '12 days', change: 'Keep it up', icon: Target },
  ],
  faculty: [
    { label: 'Classes', value: '5', change: 'Spring term', icon: BookOpen },
    { label: 'Students', value: '142', change: 'Across sections', icon: Users },
    { label: 'To grade', value: '18', change: 'Pending review', icon: FileText },
    { label: 'Sessions', value: '3', change: 'This week', icon: Calendar },
  ],
  coordinator: [
    { label: 'Team members', value: '86', change: 'Active accounts', icon: Users },
    { label: 'Pending approvals', value: '—', change: 'See Approvals', icon: UserCheck },
    { label: 'Departments', value: '4', change: 'Managed', icon: BookOpen },
    { label: 'Activity', value: '94%', change: 'Engagement', icon: TrendingUp },
  ],
};

export function MemberDashboardPage() {
  const { user, hydrateFromStorage } = useMemberAuthStore();
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [history, setHistory] = useState<MemberLoginEntry[]>([]);
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);
  const [alertUserId, setAlertUserId] = useState<string | undefined>();

  const role = user?.role ?? 'student';
  const stats = STATS_BY_ROLE[role];
  const paths = memberPaths(role);
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Member';

  useEffect(() => {
    hydrateFromStorage();
    setLastLogin(getMemberLastLogin());
    setHistory(getMemberLoginHistory().filter((e) => e.role === role || !e.role));
    if (user?.role) {
      const code = sessionStorage.getItem(memberRecoveryStorageKey(user.role));
      const uid = sessionStorage.getItem(memberUserIdStorageKey(user.role)) ?? user.userId;
      if (code) {
        setRecoveryCodeAlert(code);
        setAlertUserId(uid || undefined);
      }
    }
  }, [hydrateFromStorage, user?.role, user?.userId, role]);

  const dismissRecovery = () => {
    if (user?.role) {
      sessionStorage.removeItem(memberRecoveryStorageKey(user.role));
      sessionStorage.removeItem(memberUserIdStorageKey(user.role));
    }
    setRecoveryCodeAlert(null);
  };

  return (
    <>
      {recoveryCodeAlert && (
        <RecoveryCodeAlertModal
          recoveryCode={recoveryCodeAlert}
          userId={alertUserId}
          onDismiss={dismissRecovery}
        />
      )}

      <div className="space-y-6">
        <DashboardPageHeader
          breadcrumb="Dashboard / Home"
          title={`Welcome back, ${displayName}`}
          subtitle={
            role === 'coordinator'
              ? `${MEMBER_ROLE_LABELS[role]} overview — use Approvals for sign-in requests.`
              : `${MEMBER_ROLE_LABELS[role]} overview — update your profile anytime.`
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DashboardSummaryCard
            label="Last login"
            value={lastLogin ? formatMemberDateTime(lastLogin) : '—'}
            hint={user?.email ? `Signed in as ${user.email}` : 'Sign in to record session'}
            icon={LogIn}
          />
          <DashboardSummaryCard
            label="Login history"
            value={`${history.length} sessions`}
            hint="Stored on this device"
            icon={History}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <DashboardStatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardBarChart title="Activity" subtitle="Weekly overview (sample)" />
          <div className="sa-chart-panel neo-inset p-6">
            <h2 className="text-lg font-bold text-[var(--neo-text)]">Quick links</h2>
            <p className="text-xs text-[var(--neo-muted)]">Shortcuts for your portal</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={paths.profile}
                  className="neo-card block rounded-[var(--neo-radius-md)] px-4 py-3 text-sm font-semibold text-[var(--neo-text)] transition-transform hover:-translate-y-0.5"
                >
                  View & edit profile →
                </Link>
              </li>
              {role === 'coordinator' && (
                <li>
                  <Link
                    href={paths.approvals}
                    className="neo-card block rounded-[var(--neo-radius-md)] px-4 py-3 text-sm font-semibold text-[var(--neo-text)] transition-transform hover:-translate-y-0.5"
                  >
                    Review sign-in approvals →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <DashboardLoginTable history={history} formatDate={formatMemberDateTime} />
      </div>
    </>
  );
}
