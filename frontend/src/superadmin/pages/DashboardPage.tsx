'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield, Activity, Server, LogIn, History } from 'lucide-react';
import { useAuthStore } from '@/superadmin/store/auth.store';
import { getSaLastLogin, getSaLoginHistory, formatSaDateTime, SaLoginEntry } from '@/superadmin/lib/sa-session';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DashboardSummaryCard } from '@/components/dashboard/DashboardSummaryCard';
import { DashboardBarChart } from '@/components/dashboard/DashboardBarChart';
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart';
import { DashboardLoginTable } from '@/components/dashboard/DashboardLoginTable';

const STATS = [
  { label: 'Total learners', value: '12,480', change: '+8.2%', icon: Users },
  { label: 'Active courses', value: '186', change: '+3 new', icon: Activity },
  { label: 'Security score', value: '98%', change: 'Excellent', icon: Shield },
  { label: 'System uptime', value: '99.97%', change: '30 days', icon: Server },
];

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrateFromStorage } = useAuthStore();
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [history, setHistory] = useState<SaLoginEntry[]>([]);

  useEffect(() => {
    hydrateFromStorage();
    setLastLogin(getSaLastLogin());
    setHistory(getSaLoginHistory());
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken') && !isAuthenticated) {
      router.replace('/superadmin/auth/signin');
    }
  }, [isAuthenticated, router]);

  const displayName = user?.email?.split('@')[0] ?? 'Admin';

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        breadcrumb="Dashboard / Home"
        title={`Welcome back, ${displayName}`}
        subtitle="Platform overview — use Add members for invites and approvals."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashboardSummaryCard
          label="Last login"
          value={lastLogin ? formatSaDateTime(lastLogin) : '—'}
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
        <DashboardBarChart title="Engagement" subtitle="Weekly active users (sample)" />
        <DashboardLineChart title="Sign-in trend" subtitle="Last 7 days (sample)" />
      </div>

      <DashboardLoginTable history={history} />
    </div>
  );
}
