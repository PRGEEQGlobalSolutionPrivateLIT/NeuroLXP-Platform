'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { MemberDashboardActions } from '@/components/members/MemberDashboardActions';
import { UploadedCredentialsPanel } from '@/components/members/UploadedCredentialsPanel';
import { RecentBulkUploadsList } from '@/components/members/RecentBulkUploadsList';
import { isValidBulkUploadId } from '@/lib/bulk-credentials-cache';
import { platformAdminApi } from '@/lib/platform-admin-api';
import neoToast from '@/lib/toast';

type InstitutionPending = {
  id: string;
  institution_admin: { full_name: string; primary_email: string; user_id: string | null };
};

export function PlatformAdminAddMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const rawBulkUpload = searchParams.get('bulkUpload');
  const bulkUpload = isValidBulkUploadId(rawBulkUpload) ? rawBulkUpload : null;
  const [institutionPending, setInstitutionPending] = useState<InstitutionPending[]>([]);

  const load = useCallback(() => {
    platformAdminApi
      .listInstitutionPendingApprovals()
      .then(({ data }) => setInstitutionPending(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (bulkUpload) {
      document.getElementById(`bulk-upload-${bulkUpload}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [bulkUpload]);

  const refreshAll = () => {
    load();
    window.dispatchEvent(new CustomEvent('pa-approvals-refresh'));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Add members</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Add members</h1>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          Invite institution admins and learners; approve pending sign-ins.
        </p>
      </div>

      <div className="neo-card p-6">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">Add institution admin</h2>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">Create a new institution administrator account</p>
        <div className="mt-4">
          <NeumorphicButton
            variant="primary"
            onClick={() => router.push('/platform-admin/institution-admin/invite')}
          >
            Add Institution Admin
          </NeumorphicButton>
        </div>
      </div>

      <div className="neo-card p-6">
        <MemberDashboardActions basePath="/platform-admin" />
      </div>

      {institutionPending.length > 0 && (
        <section className="neo-card p-6">
          <h2 className="text-lg font-bold text-[var(--neo-text)]">Institution admin approvals</h2>
          <ul className="mt-4 space-y-3">
            {institutionPending.map((req) => (
              <li
                key={req.id}
                id={`approval-${req.id}`}
                className={clsx(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-all',
                  highlight === req.id ? 'sa-highlight neo-inset' : 'neo-inset',
                )}
              >
                <div>
                  <p className="font-semibold text-[var(--neo-text)]">{req.institution_admin.full_name}</p>
                  <p className="text-xs text-[var(--neo-muted)]">{req.institution_admin.primary_email}</p>
                </div>
                <NeumorphicButton
                  variant="primary"
                  onClick={async () => {
                    await platformAdminApi.approveInstitutionRequest(req.id);
                    neoToast.success('Institution admin approved');
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

      {institutionPending.length === 0 && !bulkUpload && (
        <div className="neo-inset rounded-2xl p-6 text-center text-sm text-[var(--neo-muted)]">
          No pending approval requests. New requests will appear here and in notifications.
        </div>
      )}

      {bulkUpload && (
        <UploadedCredentialsPanel
          bulkUploadId={bulkUpload}
          fixUrlBasePath="/platform-admin"
        />
      )}

      <RecentBulkUploadsList basePath="/platform-admin" />
    </div>
  );
}
