interface Props {
  title: string;
  subtitle: string;
  points?: string;
}

const DEFAULT_POINTS = '0,50 30,35 60,40 90,20 120,28 150,15 180,25 200,10';

export function DashboardLineChart({ title, subtitle, points = DEFAULT_POINTS }: Props) {
  return (
    <div className="sa-chart-panel neo-inset p-6">
      <h2 className="text-lg font-bold text-[var(--neo-text)]">{title}</h2>
      <p className="text-xs text-[var(--neo-muted)]">{subtitle}</p>
      <div className="dash-line-chart mt-8 h-36 p-4">
        <svg viewBox="0 0 200 60" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
          <polyline
            fill="none"
            stroke="var(--neo-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
}
