'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { LucideIcon, Bell, Search, LogOut, Settings } from 'lucide-react';
import { NeuroLXPLogo } from '@/components/dashboard/NeuroLXPLogo';
import { SaPopupModal } from '@/superadmin/components/SaPopupModal';

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type DashboardThemeOption = {
  id: string;
  label: string;
  description: string;
  preview: string;
};

export type DashboardNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId?: string;
};

interface Props {
  children: ReactNode;
  portalLabel: string;
  displayName: string;
  displayEmail: string;
  avatar: ReactNode;
  nav: DashboardNavItem[];
  pathname: string;
  approvalCount: number;
  notifications: DashboardNotification[];
  notificationsOpen: boolean;
  settingsOpen: boolean;
  onNotificationsOpen: (open: boolean) => void;
  onSettingsOpen: (open: boolean) => void;
  onNotificationClick: (n: DashboardNotification) => void;
  onLogout: () => void;
  themes: DashboardThemeOption[];
  theme: string;
  onThemeChange: (id: string) => void;
  notificationActionLabel?: string;
}

export function PremiumDashboardFrame({
  children,
  portalLabel,
  displayName,
  displayEmail,
  avatar,
  nav,
  pathname,
  approvalCount,
  notifications,
  notificationsOpen,
  settingsOpen,
  onNotificationsOpen,
  onSettingsOpen,
  onNotificationClick,
  onLogout,
  themes,
  theme,
  onThemeChange,
  notificationActionLabel = 'Open →',
}: Props) {
  return (
    <div className="sa-dashboard min-h-screen">
      <div className="sa-dashboard__grid mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
        <aside className="sa-sidebar neo-card flex flex-col p-5 lg:p-6">
          <NeuroLXPLogo size="sidebar" showWordmark={false} className="mb-6" />

          <div className="neo-inset flex flex-col items-center rounded-[var(--neo-radius-lg)] p-4 text-center">
            {avatar}
            <p className="mt-3 text-sm font-bold text-[var(--neo-text)]">{displayName}</p>
            <p className="mt-0.5 text-xs font-medium text-[var(--neo-muted)]">{portalLabel}</p>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-2" aria-label="Main">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'sa-nav-item flex items-center gap-3 rounded-[var(--neo-radius-md)] px-4 py-3 text-sm font-semibold transition-all duration-200',
                    active
                      ? 'sa-nav-item--active text-[var(--neo-primary)]'
                      : 'text-[var(--neo-muted)] hover:text-[var(--neo-primary)]',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-80" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onLogout}
            className="sa-nav-item mt-4 flex items-center gap-3 rounded-[var(--neo-radius-md)] px-4 py-3 text-sm font-semibold text-[var(--neo-muted)] transition-colors hover:text-[var(--neo-danger)]"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </aside>

        <div className="sa-main flex min-w-0 flex-col gap-4">
          <header className="sa-topbar neo-card flex flex-wrap items-center gap-3 px-4 py-3 md:px-5 md:py-4">
            <div className="sa-search neo-inset flex min-w-[200px] flex-1 items-center gap-2 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--neo-muted)]" />
              <input
                type="search"
                placeholder="Search"
                className="neo-input-reset w-full text-sm"
              />
            </div>

            <div className="sa-topbar-actions ml-auto flex items-center gap-2">
              <button
                type="button"
                className="dash-icon-btn neo-inset flex h-11 w-11 items-center justify-center rounded-[var(--neo-radius-md)]"
                onClick={() => {
                  onNotificationsOpen(false);
                  onSettingsOpen(true);
                }}
                aria-label="Appearance settings"
              >
                <Settings className="h-5 w-5 text-[var(--neo-primary)]" />
              </button>

              <button
                type="button"
                className="dash-icon-btn neo-inset relative flex h-11 w-11 items-center justify-center rounded-[var(--neo-radius-md)]"
                onClick={() => {
                  onSettingsOpen(false);
                  onNotificationsOpen(true);
                }}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-[var(--neo-primary)]" />
                {approvalCount > 0 && (
                  <span className="sa-badge absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--neo-danger)] px-1 text-[10px] font-bold text-white">
                    {approvalCount > 9 ? '9+' : approvalCount}
                  </span>
                )}
              </button>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-tight text-[var(--neo-text)]">{displayName}</p>
                <p className="text-xs text-[var(--neo-muted)]">{displayEmail}</p>
              </div>
            </div>
          </header>

          <main className="sa-content dash-content min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <SaPopupModal
        open={notificationsOpen}
        onClose={() => onNotificationsOpen(false)}
        title="Notifications"
        maxWidth="max-w-lg"
      >
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onNotificationClick(n)}
                className={clsx(
                  'w-full rounded-[var(--neo-radius-md)] px-4 py-3 text-left text-sm transition-all',
                  n.type !== 'info' ? 'neo-inset hover:opacity-95' : 'text-[var(--neo-muted)]',
                )}
              >
                <p className="font-semibold text-[var(--neo-text)]">{n.title}</p>
                <p className="mt-1 text-xs text-[var(--neo-muted)]">{n.message}</p>
                {n.type !== 'info' && (
                  <p className="mt-2 text-xs font-semibold text-[var(--neo-primary)]">{notificationActionLabel}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      </SaPopupModal>

      <SaPopupModal open={settingsOpen} onClose={() => onSettingsOpen(false)} title="Appearance" maxWidth="max-w-md">
        <p className="mb-4 text-sm text-[var(--neo-muted)]">
          Choose a surface style. Changes apply immediately across the dashboard.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onThemeChange(t.id)}
              className={clsx(
                'rounded-[var(--neo-radius-md)] p-3 text-left transition-all',
                theme === t.id ? 'neo-inset ring-2 ring-[var(--neo-primary)]' : 'neo-card hover:-translate-y-0.5',
              )}
            >
              <span
                className="mb-2 block h-10 w-full rounded-lg border border-white/50"
                style={{ background: t.preview }}
              />
              <span className="text-sm font-bold text-[var(--neo-text)]">{t.label}</span>
              <span className="mt-0.5 block text-xs text-[var(--neo-muted)]">{t.description}</span>
            </button>
          ))}
        </div>
      </SaPopupModal>
    </div>
  );
}
