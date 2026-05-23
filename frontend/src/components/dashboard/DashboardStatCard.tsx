import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export function DashboardStatCard({ label, value, change, icon: Icon }: Props) {
  return (
    <div className="dash-stat neo-card flex items-start gap-4 p-5">
      <div className="dash-stat__icon neo-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--neo-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--neo-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-bold leading-tight text-[var(--neo-text)]">{value}</p>
        <span className="neo-badge-success mt-2 inline-block text-xs font-semibold">{change}</span>
      </div>
    </div>
  );
}
