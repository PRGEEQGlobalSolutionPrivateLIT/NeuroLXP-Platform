'use client';

import { StudentMemberProfilePage } from '@/member/pages/StudentMemberProfilePage';
import { useEffect, useRef, useState } from 'react';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { MemberAvatar } from '@/member/components/MemberAvatar';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { membersApi } from '@/lib/members-api';
import { setStoredMemberAvatar } from '@/member/lib/member-avatar';
import neoToast from '@/lib/toast';

type Profile = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  employeeId: string | null;
  userId: string | null;
  onboardingCompleted: boolean;
};

export function MemberProfilePage() {
  const { user } = useMemberAuthStore();
  if (user?.role === 'student') {
    return <StudentMemberProfilePage />;
  }
  return <MemberProfilePageDefault />;
}

function MemberProfilePageDefault() {
  const { user } = useMemberAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    department: '',
    employeeId: '',
  });

  const loadProfile = () => {
    if (!user?.memberId) return;
    membersApi
      .getProfile(user.memberId)
      .then(({ data }) => {
        setProfile(data);
        setForm({
          fullName: data.fullName,
          phone: data.phone ?? '',
          department: data.department ?? '',
          employeeId: data.employeeId ?? '',
        });
      })
      .catch(() => neoToast.error('Could not load profile'));
  };

  useEffect(() => {
    loadProfile();
  }, [user?.memberId]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await membersApi.updateProfile(user.memberId, {
        fullName: form.fullName,
        phone: form.phone,
        department: form.department || undefined,
        employeeId: form.employeeId || undefined,
      });
      neoToast.success('Profile updated');
      setEditing(false);
      loadProfile();
      window.dispatchEvent(new CustomEvent('member-portal-refresh'));
    } catch {
      neoToast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      neoToast.error('Please choose an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      neoToast.error('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setStoredMemberAvatar(user?.memberId, reader.result as string);
      neoToast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!profile) {
    return <div className="neo-card p-8 text-center text-[var(--neo-muted)]">Loading profile…</div>;
  }

  const showWorkFields = user?.role === 'faculty' || user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Profile</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Your profile</h1>
      </div>

      <div className="neo-card p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-[var(--neo-shadow-dark)]/10 pb-6 sm:flex-row sm:items-start">
          <MemberAvatar memberId={user?.memberId} name={profile.fullName} size="md" ring />
          <div className="text-center sm:text-left">
            {profile.userId && (
              <p className="font-mono text-sm font-bold text-[var(--neo-primary)]">{profile.userId}</p>
            )}
            <h3 className="text-xl font-bold text-[var(--neo-text)]">{profile.fullName}</h3>
            <p className="text-sm capitalize text-[var(--neo-muted)]">{profile.role}</p>
            <p className="text-sm text-[var(--neo-muted)]">{profile.email}</p>
          </div>
          <NeumorphicButton className="sm:ml-auto" onClick={() => setEditing((e) => !e)}>
            {editing ? 'Cancel' : 'Edit profile'}
          </NeumorphicButton>
        </div>

        {editing ? (
          <div className="neo-form-stack mt-6">
            <div className="neo-inset rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--neo-text)]">Profile photo</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPick} />
              <div className="mt-4 flex flex-wrap gap-2">
                <NeumorphicButton type="button" variant="primary" onClick={() => fileRef.current?.click()}>
                  Change photo
                </NeumorphicButton>
                <NeumorphicButton
                  type="button"
                  onClick={() => {
                    setStoredMemberAvatar(user?.memberId, null);
                    neoToast.success('Photo removed');
                  }}
                >
                  Remove photo
                </NeumorphicButton>
              </div>
            </div>
            <NeumorphicInput
              label="Full name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
            <NeumorphicInput
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            {showWorkFields && (
              <>
                <NeumorphicInput
                  label="Department"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                />
                <NeumorphicInput
                  label="Employee ID"
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                />
              </>
            )}
            <NeumorphicButton variant="primary" loading={loading} onClick={save}>
              Save changes
            </NeumorphicButton>
          </div>
        ) : (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" value={profile.phone || '—'} />
            {showWorkFields && (
              <>
                <Field label="Department" value={profile.department || '—'} />
                <Field label="Employee ID" value={profile.employeeId || '—'} />
              </>
            )}
            <Field label="Onboarding" value={profile.onboardingCompleted ? 'Complete' : 'Pending'} />
          </dl>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="neo-inset rounded-xl px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--neo-text)]">{value}</dd>
    </div>
  );
}
