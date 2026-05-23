import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function DashboardSummaryCard({ label, value, hint, icon: Icon }: Props) {
  return (
    <div className="dash-info-card neo-card flex items-start gap-4 p-5">
      <span className="neo-icon-box flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--neo-primary)]">
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--neo-muted)]">{label}</p>
        <p className="mt-1 text-lg font-bold text-[var(--neo-text)]">{value}</p>
        {hint && <p className="mt-1 text-xs text-[var(--neo-muted)]">{hint}</p>}
      </div>
    </div>
  );
}
