'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { MemberDashboardActions } from '@/components/members/MemberDashboardActions';
import { membersApi } from '@/lib/members-api';
import neoToast from '@/lib/toast';

type MemberPending = {
  id: string;
  member: { full_name: string; email: string; role: string };
};

export function InstitutionAdminAddMembersPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [memberPending, setMemberPending] = useState<MemberPending[]>([]);

  const load = useCallback(() => {
    membersApi
      .listPendingApprovals('institution_admin')
      .then(({ data }) => setMemberPending(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = () => {
    load();
    window.dispatchEvent(new CustomEvent('ia-approvals-refresh'));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Add members</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Add members</h1>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          Invite coordinators, faculty, and students; approve pending sign-ins.
        </p>
      </div>

      <div className="neo-card p-6">
        <MemberDashboardActions basePath="/institution-admin" />
      </div>

      {memberPending.length > 0 && (
        <section className="neo-card p-6">
          <h2 className="text-lg font-bold text-[var(--neo-text)]">Member sign-in approvals</h2>
          <ul className="mt-4 space-y-3">
            {memberPending.map((req) => (
              <li
                key={req.id}
                id={`approval-${req.id}`}
                className={clsx(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-all',
                  highlight === req.id ? 'sa-highlight neo-inset' : 'neo-inset',
                )}
              >
                <div>
                  <p className="font-semibold capitalize text-[var(--neo-text)]">{req.member.role}</p>
                  <p className="font-medium text-[var(--neo-text)]">{req.member.full_name}</p>
                  <p className="text-xs text-[var(--neo-muted)]">{req.member.email}</p>
                </div>
                <NeumorphicButton
                  variant="primary"
                  onClick={async () => {
                    await membersApi.approveMemberRequest(req.id);
                    neoToast.success('Member approved');
                    refreshAll();
                  }}
                >
                  Approve
                </NeumorphicButton>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memberPending.length === 0 && (
        <div className="neo-inset rounded-2xl p-6 text-center text-sm text-[var(--neo-muted)]">
          No pending approval requests. New requests will appear here and in notifications.
        </div>
      )}
    </div>
  );
}
