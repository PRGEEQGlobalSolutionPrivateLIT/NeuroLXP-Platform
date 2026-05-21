'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import {
  RecoveryCodeAlertModal,
  PLATFORM_RECOVERY_STORAGE_KEY,
} from '@/components/ui/RecoveryCodeAlertModal';
import { usePlatformAuthStore } from '@/platform-admin/store/auth.store';
import { platformAdminApi } from '@/lib/platform-admin-api';
import neoToast from '@/lib/toast';
import { MemberDashboardActions } from '@/components/members/MemberDashboardActions';

type InstitutionPending = {
  id: string;
  institution_admin: { full_name: string; primary_email: string; user_id: string | null };
};

export function PlatformAdminDashboardPage() {
  const router = useRouter();
  const { user, logout, hydrateFromStorage, isAuthenticated } = usePlatformAuthStore();
  const [pendingInstitution, setPendingInstitution] = useState<InstitutionPending[]>([]);
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const token = localStorage.getItem('platformAccessToken');
    if (!token && !isAuthenticated) router.replace('/platform-admin/auth/signin');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const pending = sessionStorage.getItem(PLATFORM_RECOVERY_STORAGE_KEY);
    if (pending) setRecoveryCodeAlert(pending);
  }, []);

  useEffect(() => {
    platformAdminApi
      .listInstitutionPendingApprovals()
      .then(({ data }) => setPendingInstitution(data))
      .catch(() => {});
  }, []);

  const dismissRecoveryAlert = () => {
    sessionStorage.removeItem(PLATFORM_RECOVERY_STORAGE_KEY);
    setRecoveryCodeAlert(null);
  };

  const approve = async (requestId: string) => {
    try {
      await platformAdminApi.approveInstitutionRequest(requestId);
      setPendingInstitution((prev) => prev.filter((p) => p.id !== requestId));
      neoToast.success('Institution admin approved');
    } catch {
      neoToast.error('Approval failed');
    }
  };

  return (
    <div className="neo-page min-h-screen p-8">
      {recoveryCodeAlert && (
        <RecoveryCodeAlertModal recoveryCode={recoveryCodeAlert} onDismiss={dismissRecoveryAlert} />
      )}

      <div className="mx-auto max-w-4xl neo-card p-8">
        <p className="neo-kicker">Platform Admin</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--neo-muted)]">
          Signed in as {user?.email ?? 'admin'} · User ID: {user?.userId ?? '—'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <NeumorphicButton variant="primary" onClick={() => router.push('/platform-admin/institution-admin/invite')}>
            Add Institution Admin
          </NeumorphicButton>
          <NeumorphicButton
            onClick={() => {
              logout();
              router.replace('/platform-admin/auth/signin');
            }}
          >
            Sign out
          </NeumorphicButton>
        </div>

        <MemberDashboardActions basePath="/platform-admin" />

        {pendingInstitution.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[var(--neo-text)]">Pending institution admin sign-ins</h2>
            <ul className="mt-4 space-y-3">
              {pendingInstitution.map((req) => (
                <li key={req.id} className="neo-card flex flex-wrap items-center justify-between gap-3 !p-4">
                  <div>
                    <p className="font-medium text-[var(--neo-text)]">{req.institution_admin.full_name}</p>
                    <p className="text-sm text-[var(--neo-muted)]">{req.institution_admin.primary_email}</p>
                  </div>
                  <NeumorphicButton variant="primary" onClick={() => approve(req.id)}>
                    Approve
                  </NeumorphicButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
