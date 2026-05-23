'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, Activity, BookOpen, LogIn, History } from 'lucide-react';
import { useInstitutionAuthStore } from '@/institution-admin/store/auth.store';
import { getIaLastLogin, getIaLoginHistory, IaLoginEntry } from '@/institution-admin/lib/ia-session';
import {
  RecoveryCodeAlertModal,
  INSTITUTION_RECOVERY_STORAGE_KEY,
} from '@/components/ui/RecoveryCodeAlertModal';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart';
import { DashboardLoginTable, formatIaDateTime } from '@/components/dashboard/DashboardLoginTable';

const STATS = [
  { label: 'Total members', value: '1,240', change: '+12 this week', icon: Users },
  { label: 'Active courses', value: '48', change: '+2 new', icon: BookOpen },
  { label: 'Engagement', value: '92%', change: 'Strong', icon: Activity },
  { label: 'Security score', value: '96%', change: 'Excellent', icon: Shield },
];

export function InstitutionAdminDashboardPage() {
  const { user, hydrateFromStorage } = useInstitutionAuthStore();
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [history, setHistory] = useState<IaLoginEntry[]>([]);
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    setLastLogin(getIaLastLogin());
    setHistory(getIaLoginHistory());
    const pending = sessionStorage.getItem(INSTITUTION_RECOVERY_STORAGE_KEY);
    if (pending) setRecoveryCodeAlert(pending);
  }, [hydrateFromStorage]);

  const dismissRecoveryAlert = () => {
    sessionStorage.removeItem(INSTITUTION_RECOVERY_STORAGE_KEY);
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
          subtitle="Institution overview — use Add members for invites and approvals."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DashboardSummaryCard
            label="Last login"
            value={lastLogin ? formatIaDateTime(lastLogin) : '—'}
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
            title="Member activity"
            subtitle="Weekly active members (sample)"
            values={[30, 50, 42, 68, 55, 78, 60]}
          />
          <DashboardLineChart
            title="Sign-in trend"
            subtitle="Last 7 days (sample)"
            points="0,48 30,40 60,35 90,28 120,32 150,20 180,25 200,18"
          />
        </div>

        <DashboardLoginTable history={history} formatDate={formatIaDateTime} />
      </div>
    </>
  );
}
