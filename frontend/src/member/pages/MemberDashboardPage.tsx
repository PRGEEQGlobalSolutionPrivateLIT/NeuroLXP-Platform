'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import neoToast from '@/lib/toast';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { RecoveryCodeAlertModal } from '@/components/ui/RecoveryCodeAlertModal';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { membersApi } from '@/lib/members-api';
import {
  memberPaths,
  memberRecoveryStorageKey,
  memberUserIdStorageKey,
  MEMBER_PORTAL_TITLE,
  MEMBER_ROLE_LABELS,
  defaultMemberSigninPath,
  memberPageTitle,
} from '@/member/lib/member-routes';

type Pending = {
  id: string;
  member: { full_name: string; email: string; role: string; phone: string | null };
};

export function MemberDashboardPage() {
  const router = useRouter();
  const { user, logout, hydrateFromStorage, isAuthenticated } = useMemberAuthStore();
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [recoveryCodeAlert, setRecoveryCodeAlert] = useState<string | null>(null);
  const [alertUserId, setAlertUserId] = useState<string | undefined>();
  const [displayUserId, setDisplayUserId] = useState('');

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!localStorage.getItem('memberAccessToken') && !isAuthenticated) {
      router.replace(defaultMemberSigninPath());
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user?.role) {
      document.title = memberPageTitle(user.role, 'Dashboard');
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role) {
      const code = sessionStorage.getItem(memberRecoveryStorageKey(user.role));
      const uid = sessionStorage.getItem(memberUserIdStorageKey(user.role)) ?? user.userId;
      if (code) {
        setRecoveryCodeAlert(code);
        setAlertUserId(uid || undefined);
      }
    }
  }, [user?.role, user?.userId]);

  useEffect(() => {
    if (user?.memberId) {
      membersApi.getProfile(user.memberId).then(({ data }) => {
        setProfileName(data.fullName);
        setProfilePhone(data.phone ?? '');
        setDisplayUserId(data.userId ?? user.userId ?? '');
      }).catch(() => {});
    }
  }, [user?.memberId]);

  useEffect(() => {
    if (user?.role === 'coordinator') {
      membersApi.listPendingApprovals('coordinator').then(({ data }) => setPending(data)).catch(() => {});
    }
  }, [user?.role]);

  const dismissRecovery = () => {
    if (user?.role) {
      sessionStorage.removeItem(memberRecoveryStorageKey(user.role));
      sessionStorage.removeItem(memberUserIdStorageKey(user.role));
    }
    setRecoveryCodeAlert(null);
    setAlertUserId(undefined);
  };

  const handleSignOut = () => {
    const signinPath = user?.role ? memberPaths(user.role).signin : defaultMemberSigninPath();
    logout();
    router.replace(signinPath);
  };

  return (
    <div className="neo-page min-h-screen p-8">
      {recoveryCodeAlert && (
        <RecoveryCodeAlertModal
          recoveryCode={recoveryCodeAlert}
          userId={alertUserId}
          onDismiss={dismissRecovery}
        />
      )}

      <div className="mx-auto max-w-4xl neo-card p-8">
        <p className="neo-kicker">{user?.role ? MEMBER_ROLE_LABELS[user.role] : 'Member'}</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">
          {user?.role ? MEMBER_PORTAL_TITLE[user.role] : 'Member Portal'}
        </h1>
        <p className="mt-2 text-sm text-[var(--neo-muted)]">
          {user?.fullName} · {user?.email}
        </p>
        {displayUserId && (
          <p className="mt-2 font-mono text-sm font-bold text-[var(--neo-primary)]">
            User ID: {displayUserId}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <NeumorphicInput label="Full name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          <NeumorphicInput label="Phone" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
          <NeumorphicButton variant="primary" loading={loading} onClick={async () => {
            if (!user) return;
            setLoading(true);
            try {
              await membersApi.updateProfile(user.memberId, { fullName: profileName, phone: profilePhone });
              neoToast.success('Profile updated');
            } catch {
              neoToast.error('Update failed');
            } finally {
              setLoading(false);
            }
          }}>
            Save profile
          </NeumorphicButton>
        </div>

        {user?.role === 'coordinator' && pending.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Student & faculty sign-in approvals</h2>
            <ul className="mt-4 space-y-3">
              {pending.map((req) => (
                <li key={req.id} className="neo-card flex flex-wrap justify-between gap-3 !p-4">
                  <div>
                    <p className="font-medium">{req.member.full_name}</p>
                    <p className="text-xs text-[var(--neo-muted)]">{req.member.role} · {req.member.email}</p>
                  </div>
                  <NeumorphicButton variant="primary" onClick={async () => {
                    await membersApi.approveMemberRequest(req.id);
                    setPending((p) => p.filter((x) => x.id !== req.id));
                    neoToast.success('Approved');
                  }}>
                    Approve
                  </NeumorphicButton>
                </li>
              ))}
            </ul>
          </div>
        )}

        <NeumorphicButton className="mt-6" onClick={handleSignOut}>
          Sign out
        </NeumorphicButton>
      </div>
    </div>
  );
}
