'use client';

import { ReactNode } from 'react';

interface Props {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function DashboardPageHeader({ breadcrumb, title, subtitle, action }: Props) {
  return (
    <header className="dash-page-header neo-card flex flex-wrap items-end justify-between gap-4 p-5 md:p-6">
      <div>
        <nav className="text-xs font-bold uppercase tracking-wider text-[var(--neo-muted)]" aria-label="Breadcrumb">
          {breadcrumb}
        </nav>
        <h1 className="mt-2 text-2xl font-bold text-[var(--neo-text)] md:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--neo-muted)]">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
