'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { membersApi } from '@/lib/members-api';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { isMemberRole, memberPaths } from '@/member/lib/member-routes';
import neoToast from '@/lib/toast';

type Pending = {
  id: string;
  member: { full_name: string; email: string; role: string; phone: string | null };
};

export function MemberApprovalsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const { user } = useMemberAuthStore();
  const roleParam = typeof params.role === 'string' ? params.role : user?.role;
  const [pending, setPending] = useState<Pending[]>([]);

  const load = useCallback(() => {
    membersApi.listPendingApprovals('coordinator').then(({ data }) => setPending(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isMemberRole(roleParam) || roleParam !== 'coordinator') {
      const target = isMemberRole(user?.role) ? user.role : 'student';
      router.replace(memberPaths(target).dashboard);
      return;
    }
    load();
  }, [user?.role, roleParam, router, load]);

  const refreshAll = () => {
    load();
    window.dispatchEvent(new CustomEvent('member-portal-refresh'));
  };

  if (roleParam !== 'coordinator' || user?.role !== 'coordinator') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Approvals</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Sign-in approvals</h1>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          Approve faculty and student sign-ins that need coordinator clearance.
        </p>
      </div>

      {pending.length > 0 ? (
        <ul className="space-y-3">
          {pending.map((req) => (
            <li
              key={req.id}
              id={`approval-${req.id}`}
              className={clsx(
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-all',
                highlight === req.id ? 'sa-highlight neo-inset' : 'neo-inset',
              )}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--neo-primary)]">
                  {req.member.role}
                </p>
                <p className="font-semibold text-[var(--neo-text)]">{req.member.full_name}</p>
                <p className="text-sm text-[var(--neo-muted)]">{req.member.email}</p>
              </div>
              <NeumorphicButton
                variant="primary"
                onClick={async () => {
                  await membersApi.approveMemberRequest(req.id);
                  neoToast.success('Approved');
                  refreshAll();
                }}
              >
                Approve
              </NeumorphicButton>
            </li>
          ))}
        </ul>
      ) : (
        <div className="neo-inset rounded-2xl p-8 text-center text-sm text-[var(--neo-muted)]">
          No pending approvals. You will be notified when someone needs approval.
        </div>
      )}
    </div>
  );
}
