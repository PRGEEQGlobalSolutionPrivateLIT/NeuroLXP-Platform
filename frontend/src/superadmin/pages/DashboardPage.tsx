'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  Activity,
  Server,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/superadmin/store/auth.store';
import { ProtectedRoute } from '@/superadmin/components/ProtectedRoute';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import neoToast from '@/lib/toast';

const STATS: { label: string; value: string; change: string; icon: LucideIcon }[] = [
  { label: 'Total learners', value: '12,480', change: '+8.2%', icon: Users },
  { label: 'Active courses', value: '186', change: '+3 new', icon: Activity },
  { label: 'Security score', value: '98%', change: 'Excellent', icon: Shield },
  { label: 'System uptime', value: '99.97%', change: '30 days', icon: Server },
];

const RECENT_SIGNUPS = [
  { name: 'Dr. Ananya Sharma', role: 'Org Admin', time: '12 min ago', status: 'Pending approval' },
  { name: 'Rajesh Kumar', role: 'Instructor', time: '45 min ago', status: 'Verified' },
  { name: 'Priya Menon', role: 'Super Admin', time: '2 hr ago', status: 'Verified' },
  { name: 'Vikram Patel', role: 'Content Manager', time: '5 hr ago', status: 'Documents pending' },
];

const ACTIVITY = [
  { title: 'Sign-in successful', detail: 'Primary OTP verified', time: 'Just now', ok: true },
  { title: 'Course published', detail: 'Advanced Cardiology — Module 4', time: '1 hr ago', ok: true },
  { title: 'Failed login attempt', detail: 'IP 192.168.1.44 blocked', time: '3 hr ago', ok: false },
  { title: 'Backup completed', detail: 'Daily snapshot stored', time: '6 hr ago', ok: true },
  { title: 'New institution onboarded', detail: 'Apollo Medical Institute', time: 'Yesterday', ok: true },
];

const QUICK_ACTIONS = [
  'Approve pending admins',
  'Review security logs',
  'Manage course catalog',
  'Export compliance report',
];

function ProfileFieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">{label}</dt>
      <dd className={`mt-1 font-medium text-[var(--neo-text)] ${mono ? 'font-mono font-bold text-[var(--neo-primary)]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token && !isAuthenticated) {
      router.replace('/superadmin/auth/signin');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.replace('/superadmin/auth/signin');
  };

  const displayName = user?.email?.split('@')[0] ?? 'Admin';
  const displayEmail = user?.email ?? 'admin@neurolxp.com';
  const displayUserId = user?.userId ?? 'SA-DEMO-001';

  return (
    <ProtectedRoute>
      <div className="neo-page min-h-screen px-4 py-8 md:px-8">
        <nav className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="neo-kicker text-left">NeuroLXP</p>
            <h1 className="text-xl font-bold text-[var(--neo-text)]">Super Admin Portal</h1>
          </div>
          <NeumorphicButton onClick={handleLogout}>Logout</NeumorphicButton>
        </nav>

        <div className="mx-auto max-w-6xl space-y-6">
          <div className="neo-card p-6 sm:p-8">
            <p className="neo-kicker text-left">Super Admin Dashboard</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--neo-text)] md:text-3xl">
              Welcome back, {displayName}
            </h2>
            <p className="mt-2 text-sm text-[var(--neo-muted)]">
              Overview of platform health, registrations, and security — sample data for preview.
            </p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-[var(--neo-muted)]">
              Add administrator
            </h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <NeumorphicButton
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() => neoToast.info('🏢 Platform Admin — registration flow coming soon')}
              >
                1. Platform Admin
              </NeumorphicButton>
              <NeumorphicButton
                className="w-full sm:w-auto"
                onClick={() => neoToast.info('🏫 Institution Admin — registration flow coming soon')}
              >
                2. Institution Admin
              </NeumorphicButton>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <StatCard key={s.label} stat={s} Icon={Icon} />
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="neo-card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-[var(--neo-text)]">Recent admin signups</h2>
              <p className="mt-1 text-sm text-[var(--neo-muted)]">Latest registration requests</p>
              <ul className="mt-4 space-y-3">
                {RECENT_SIGNUPS.map((row) => (
                  <li
                    key={row.name}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--neo-radius-md)] bg-[var(--neo-bg-deep)] px-4 py-3 shadow-[inset_2px_2px_5px_var(--neo-shadow-dark),inset_-2px_-2px_5px_var(--neo-shadow-light)]"
                  >
                    <div>
                      <p className="font-semibold text-[var(--neo-text)]">{row.name}</p>
                      <p className="text-xs text-[var(--neo-muted)]">{row.role}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold ${
                          row.status === 'Verified' ? 'text-[var(--neo-success)]' : 'text-amber-700'
                        }`}
                      >
                        {row.status}
                      </span>
                      <p className="text-xs text-[var(--neo-muted)]">{row.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="neo-card p-6">
              <h2 className="text-lg font-bold text-[var(--neo-text)]">Your profile</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <ProfileFieldRow label="User ID" value={displayUserId} mono />
                <ProfileFieldRow label="Email" value={displayEmail} />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">Role</dt>
                  <dd className="mt-1">
                    <span className="neo-badge-success inline-flex items-center gap-1 px-2 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Super Admin
                    </span>
                  </dd>
                </div>
                <SessionRow />
              </dl>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ActivityPanel />
            <QuickActionsPanel />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  stat,
  Icon,
}: {
  stat: (typeof STATS)[number];
  Icon: LucideIcon;
}) {
  return (
    <div className="neo-card flex flex-col p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--neo-bg)] text-[var(--neo-primary)] shadow-[4px_4px_8px_var(--neo-shadow-dark),-4px_-4px_8px_var(--neo-shadow-light)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">
        {stat.label}
      </span>
      <span className="mt-1 text-2xl font-bold text-[var(--neo-text)]">{stat.value}</span>
      <span className="mt-1 text-xs font-semibold text-[var(--neo-success)]">{stat.change}</span>
    </div>
  );
}

function SessionRow() {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">Session</dt>
      <dd className="mt-1 text-xs text-[var(--neo-muted)]">Authenticated · MFA verified</dd>
    </div>
  );
}

function ActivityPanel() {
  return (
    <div className="neo-inset rounded-[var(--neo-radius-lg)] p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--neo-text)]">
        <Activity className="h-5 w-5 text-[var(--neo-primary)]" />
        Recent activity
      </h3>
      <ul className="mt-4 space-y-3">
        {ACTIVITY.map((item) => (
          <li
            key={`${item.title}-${item.time}`}
            className="flex gap-3 rounded-[var(--neo-radius-sm)] bg-[var(--neo-bg)] px-3 py-2.5"
          >
            {item.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neo-success)]" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--neo-text)]">{item.title}</p>
              <p className="text-xs text-[var(--neo-muted)]">{item.detail}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--neo-muted)]">
                <Clock className="h-3 w-3" />
                {item.time}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickActionsPanel() {
  return (
    <div className="neo-card p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--neo-text)]">
        <UserPlus className="h-5 w-5 text-[var(--neo-primary)]" />
        Quick actions
      </h3>
      <p className="mt-1 text-sm text-[var(--neo-muted)]">Common super admin tasks</p>
      <ul className="mt-4 space-y-2">
        {QUICK_ACTIONS.map((action) => (
          <li key={action}>
            <button type="button" className="neo-btn-raised w-full px-4 py-3 text-left text-sm font-semibold">
              {action}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
