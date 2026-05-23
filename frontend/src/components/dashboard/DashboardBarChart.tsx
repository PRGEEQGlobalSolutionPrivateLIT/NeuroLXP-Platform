interface Props {
  title: string;
  subtitle: string;
  values?: number[];
}

const DEFAULT_VALUES = [40, 65, 45, 80, 55, 90, 70];

export function DashboardBarChart({ title, subtitle, values = DEFAULT_VALUES }: Props) {
  return (
    <div className="sa-chart-panel neo-inset p-6">
      <h2 className="text-lg font-bold text-[var(--neo-text)]">{title}</h2>
      <p className="text-xs text-[var(--neo-muted)]">{subtitle}</p>
      <div className="mt-6 flex h-44 items-end justify-between gap-2 px-2">
        {values.map((h, i) => (
          <div
            key={i}
            className="dash-chart-bar w-full max-w-[2rem]"
            style={{ height: `${h}%` }}
            role="presentation"
          />
        ))}
      </div>
    </div>
  );
}
