'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import {
  superAdminApi,
  PlatformAdminApproval,
  InstitutionAdminApproval,
} from '@/lib/superadmin-api';
import neoToast from '@/lib/toast';
import { PlatformAdminSignupLinkCard } from '@/platform-admin/components/PlatformAdminSignupLinkCard';
import { MemberDashboardActions } from '@/components/members/MemberDashboardActions';
import { UploadedCredentialsPanel } from '@/components/members/UploadedCredentialsPanel';
import { RecentBulkUploadsList } from '@/components/members/RecentBulkUploadsList';
import { isValidBulkUploadId } from '@/lib/bulk-credentials-cache';

export function SuperAdminAddMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const rawBulkUpload = searchParams.get('bulkUpload');
  const bulkUpload = isValidBulkUploadId(rawBulkUpload) ? rawBulkUpload : null;
  const [platformPending, setPlatformPending] = useState<PlatformAdminApproval[]>([]);
  const [institutionPending, setInstitutionPending] = useState<InstitutionAdminApproval[]>([]);

  const load = useCallback(() => {
    superAdminApi.listPlatformAdminApprovals().then(({ data }) => setPlatformPending(data)).catch(() => {});
    superAdminApi
      .listInstitutionAdminApprovals()
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
    window.dispatchEvent(new CustomEvent('sa-approvals-refresh'));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Add members</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Add members</h1>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          Invite administrators and approve sign-in requests.
        </p>
      </div>

      <div className="neo-card p-6">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">Add administrator</h2>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">Create new platform or institution admin accounts</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <NeumorphicButton
            variant="primary"
            onClick={() => router.push('/superadmin/platform-admin/invite')}
          >
            1. Platform Admin
          </NeumorphicButton>
          <NeumorphicButton onClick={() => router.push('/superadmin/institution-admin/invite')}>
            2. Institution Admin
          </NeumorphicButton>
        </div>
        <PlatformAdminSignupLinkCard />
      </div>

      <div className="neo-card p-6">
        <MemberDashboardActions basePath="/superadmin" />
      </div>

      {bulkUpload && (
        <UploadedCredentialsPanel bulkUploadId={bulkUpload} fixUrlBasePath="/superadmin" />
      )}

      <RecentBulkUploadsList basePath="/superadmin" />

      {platformPending.length > 0 && (
        <section className="neo-card p-6">
          <h2 className="text-lg font-bold text-[var(--neo-text)]">Platform admin approvals</h2>
          <ul className="mt-4 space-y-3">
            {platformPending.map((req) => (
              <li
                key={req.id}
                id={`approval-${req.id}`}
                className={clsx(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-all',
                  highlight === req.id ? 'sa-highlight neo-inset' : 'neo-inset',
                )}
              >
                <div>
                  <p className="font-semibold text-[var(--neo-text)]">{req.platform_admin.full_name}</p>
                  <p className="text-xs text-[var(--neo-muted)]">{req.platform_admin.primary_email}</p>
                </div>
                <NeumorphicButton
                  variant="primary"
                  onClick={async () => {
                    await superAdminApi.approvePlatformAdmin(req.id);
                    neoToast.success('Platform admin approved');
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
                    await superAdminApi.approveInstitutionAdmin(req.id);
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

      {platformPending.length === 0 && institutionPending.length === 0 && (
        <div className="neo-inset rounded-2xl p-6 text-center text-sm text-[var(--neo-muted)]">
          No pending approval requests. New requests will appear here and in notifications.
        </div>
      )}
    </div>
  );
}
