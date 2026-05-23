'use client';

import { CheckCircle2, Laptop } from 'lucide-react';
import { formatSaDateTime } from '@/superadmin/lib/sa-session';
import { formatPaDateTime } from '@/platform-admin/lib/pa-session';
import { formatIaDateTime } from '@/institution-admin/lib/ia-session';
import { formatMemberDateTime } from '@/member/lib/member-session';

type Entry = {
  at: string;
  email: string;
  userId?: string;
  method?: string;
};

interface Props {
  history: Entry[];
  formatDate?: (iso: string) => string;
}

const defaultFormat = formatSaDateTime;

export function DashboardLoginTable({ history, formatDate = defaultFormat }: Props) {
  return (
    <div className="dash-table-card neo-card overflow-hidden p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">Recent login history</h2>
        <span className="text-xs font-medium text-[var(--neo-muted)]">{history.length} entries</span>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-[var(--neo-muted)]">No login history on this device yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="dash-table w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">
                <th className="pb-3 pr-4">Event</th>
                <th className="pb-3 pr-4">Account</th>
                <th className="pb-3 pr-4">Device</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 6).map((entry, i) => (
                <tr key={`${entry.at}-${i}`} className="dash-table-row border-t border-[var(--neo-shadow-dark)]/20">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2 font-medium text-[var(--neo-text)]">
                      <CheckCircle2 className="h-4 w-4 text-[var(--neo-success)]" />
                      Sign-in
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[var(--neo-muted)]">
                    {entry.email}
                    {entry.userId ? ` · ${entry.userId}` : ''}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5 text-[var(--neo-muted)]">
                      <Laptop className="h-3.5 w-3.5" />
                      This device
                    </span>
                  </td>
                  <td className="py-3 text-[var(--neo-muted)]">{formatDate(entry.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Re-export formatters for convenience
export { formatPaDateTime, formatIaDateTime, formatMemberDateTime };
