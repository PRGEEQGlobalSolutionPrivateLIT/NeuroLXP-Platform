'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import {
  RecoveryCodeAlertModal,
  INSTITUTION_RECOVERY_STORAGE_KEY,
} from '@/components/ui/RecoveryCodeAlertModal';
import { useInstitutionAuthStore } from '@/institution-admin/store/auth.store';
import { MemberDashboardActions } from '@/components/members/MemberDashboardActions';
import { membersApi } from '@/lib/members-api';
import neoToast from '@/lib/toast';

export function InstitutionAdminDashboardPage() {
  const router = useRouter();
  const { user, logout, hydrateFromStorage, isAuthenticated } = useInstitutionAuthStore();
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);
  const [coordinatorApprovals, setCoordinatorApprovals] = useState<
    { id: string; member: { full_name: string; email: string; role: string } }[]
  >([]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const token = localStorage.getItem('institutionAccessToken');
    if (!token && !isAuthenticated) router.replace('/institution-admin/auth/signin');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const pending = sessionStorage.getItem(INSTITUTION_RECOVERY_STORAGE_KEY);
    if (pending) setRecoveryCodeAlert(pending);
    membersApi.listPendingApprovals('institution_admin').then(({ data }) => setCoordinatorApprovals(data)).catch(() => {});
  }, []);

  const dismissRecoveryAlert = () => {
    sessionStorage.removeItem(INSTITUTION_RECOVERY_STORAGE_KEY);
    setRecoveryCodeAlert(null);
  };

  return (
    <div className="neo-page min-h-screen p-8">
      {recoveryCodeAlert && (
        <RecoveryCodeAlertModal recoveryCode={recoveryCodeAlert} onDismiss={dismissRecoveryAlert} />
      )}

      <div className="mx-auto max-w-4xl neo-card p-8">
        <p className="neo-kicker">Institution Admin</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--neo-muted)]">
          Signed in as {user?.email ?? 'admin'} · User ID: {user?.userId ?? '—'}
        </p>
        <MemberDashboardActions basePath="/institution-admin" />

        {coordinatorApprovals.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Coordinator sign-in approvals</h2>
            <ul className="mt-4 space-y-3">
              {coordinatorApprovals.map((req) => (
                <li key={req.id} className="neo-card flex flex-wrap justify-between gap-3 !p-4">
                  <div>
                    <p className="font-medium">{req.member.full_name}</p>
                    <p className="text-xs text-[var(--neo-muted)]">{req.member.email}</p>
                  </div>
                  <NeumorphicButton
                    variant="primary"
                    onClick={async () => {
                      await membersApi.approveMemberRequest(req.id);
                      setCoordinatorApprovals((p) => p.filter((x) => x.id !== req.id));
                      neoToast.success('Coordinator approved');
                    }}
                  >
                    Approve
                  </NeumorphicButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        <NeumorphicButton
          className="mt-6"
          onClick={() => {
            logout();
            router.replace('/institution-admin/auth/signin');
          }}
        >
          Sign out
        </NeumorphicButton>
      </div>
    </div>
  );
}
