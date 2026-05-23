'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, Activity, Server, LogIn, History } from 'lucide-react';
import { usePlatformAuthStore } from '@/platform-admin/store/auth.store';
import {
  getPaLastLogin,
  getPaLoginHistory,
  PaLoginEntry,
} from '@/platform-admin/lib/pa-session';
import {
  RecoveryCodeAlertModal,
  PLATFORM_RECOVERY_STORAGE_KEY,
} from '@/components/ui/RecoveryCodeAlertModal';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart';
import { DashboardLoginTable, formatPaDateTime } from '@/components/dashboard/DashboardLoginTable';

const STATS = [
  { label: 'Institutions', value: '24', change: '+2 this month', icon: Users },
  { label: 'Active learners', value: '8,420', change: '+5.1%', icon: Activity },
  { label: 'Security score', value: '97%', change: 'Strong', icon: Shield },
  { label: 'Platform uptime', value: '99.95%', change: '30 days', icon: Server },
];

export function PlatformAdminDashboardPage() {
  const { user, hydrateFromStorage } = usePlatformAuthStore();
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [history, setHistory] = useState<PaLoginEntry[]>([]);
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    setLastLogin(getPaLastLogin());
    setHistory(getPaLoginHistory());
    const pending = sessionStorage.getItem(PLATFORM_RECOVERY_STORAGE_KEY);
    if (pending) setRecoveryCodeAlert(pending);
  }, [hydrateFromStorage]);

  const dismissRecoveryAlert = () => {
    sessionStorage.removeItem(PLATFORM_RECOVERY_STORAGE_KEY);
    setRecoveryCodeAlert(null);
  };

  const displayName = user?.email?.split('@')[0] ?? 'Admin';

  return (
    <>
      {recoveryCodeAlert && (
        <RecoveryCodeAlertModal recoveryCode={recoveryCodeAlert} onDismiss={dismissRecoveryAlert} />
      )}

      <div className="space-y-6">
        <DashboardPageHeader
          breadcrumb="Dashboard / Home"
          title={`Welcome back, ${displayName}`}
          subtitle="Platform overview — use Add members for invites and approvals."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DashboardSummaryCard
            label="Last login"
            value={lastLogin ? formatPaDateTime(lastLogin) : '—'}
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
          {STATS.map((s) => (
            <DashboardStatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardBarChart
            title="Learner activity"
            subtitle="Weekly active users (sample)"
            values={[35, 55, 50, 72, 48, 85, 62]}
          />
          <DashboardLineChart
            title="Sign-in trend"
            subtitle="Last 7 days (sample)"
            points="0,45 30,38 60,42 90,25 120,30 150,18 180,28 200,15"
          />
        </div>

        <DashboardLoginTable history={history} formatDate={formatPaDateTime} />
      </div>
    </>
  );
}
