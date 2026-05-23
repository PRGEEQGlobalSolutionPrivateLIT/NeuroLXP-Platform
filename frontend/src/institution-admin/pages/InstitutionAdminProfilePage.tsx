'use client';

import { useEffect, useRef, useState } from 'react';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { InstitutionAdminAvatar } from '@/institution-admin/components/InstitutionAdminAvatar';
import { useInstitutionAuthStore } from '@/institution-admin/store/auth.store';
import { institutionAdminApi, InstitutionAdminProfile } from '@/lib/institution-admin-api';
import { setStoredIaAvatar } from '@/institution-admin/lib/ia-avatar';
import neoToast from '@/lib/toast';

export function InstitutionAdminProfilePage() {
  const { user } = useInstitutionAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<InstitutionAdminProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    primaryPhone: '',
    alternativeEmail: '',
    alternativePhone: '',
  });

  const loadProfile = () => {
    institutionAdminApi
      .getProfile()
      .then(({ data }) => {
        setProfile(data);
        setForm({
          fullName: data.fullName,
          primaryPhone: data.primaryPhone,
          alternativeEmail: data.alternativeEmail,
          alternativePhone: data.alternativePhone,
        });
      })
      .catch(() => neoToast.error('Could not load profile'));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await institutionAdminApi.updateProfile(form);
      neoToast.success('Profile updated');
      setEditing(false);
      loadProfile();
      window.dispatchEvent(new CustomEvent('ia-approvals-refresh'));
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
      const dataUrl = reader.result as string;
      setStoredIaAvatar(user?.userId, dataUrl);
      neoToast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removePhoto = () => {
    setStoredIaAvatar(user?.userId, null);
    neoToast.success('Profile photo removed');
  };

  if (!profile) {
    return <div className="neo-card p-8 text-center text-[var(--neo-muted)]">Loading profile…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Profile</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Your profile</h1>
      </div>

      <div className="neo-card p-6 md:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-[var(--neo-shadow-dark)]/10 pb-6 sm:flex-row sm:items-start">
          <InstitutionAdminAvatar userId={user?.userId} name={profile.fullName} size="md" />
          <div className="text-center sm:text-left">
            <p className="font-mono text-sm font-bold text-[var(--neo-primary)]">{profile.userId}</p>
            <h2 className="text-xl font-bold text-[var(--neo-text)]">{profile.fullName}</h2>
            <p className="text-sm text-[var(--neo-muted)]">{profile.role}</p>
            <span className="neo-badge-success mt-2 inline-block px-2 py-0.5 text-xs">
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <NeumorphicButton className="sm:ml-auto" onClick={() => setEditing((e) => !e)}>
            {editing ? 'Cancel' : 'Edit profile'}
          </NeumorphicButton>
        </div>

        {editing ? (
          <div className="neo-form-stack mt-6">
            <div className="neo-inset rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--neo-text)]">Profile photo</p>
              <p className="mt-1 text-xs text-[var(--neo-muted)]">
                Upload a photo or keep the default avatar with your initials.
              </p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPick} />
              <div className="mt-4 flex flex-wrap gap-2">
                <NeumorphicButton type="button" variant="primary" onClick={() => fileRef.current?.click()}>
                  Change photo
                </NeumorphicButton>
                <NeumorphicButton type="button" onClick={removePhoto}>
                  Remove photo
                </NeumorphicButton>
              </div>
              <div className="mt-4 flex justify-center">
                <InstitutionAdminAvatar userId={user?.userId} name={form.fullName || profile.fullName} size="md" />
              </div>
            </div>

            <NeumorphicInput
              label="Full name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
            <NeumorphicInput
              label="Primary phone"
              value={form.primaryPhone}
              onChange={(e) => setForm((f) => ({ ...f, primaryPhone: e.target.value }))}
            />
            <NeumorphicInput
              label="Alternative email"
              value={form.alternativeEmail}
              onChange={(e) => setForm((f) => ({ ...f, alternativeEmail: e.target.value }))}
            />
            <NeumorphicInput
              label="Alternative phone"
              value={form.alternativePhone}
              onChange={(e) => setForm((f) => ({ ...f, alternativePhone: e.target.value }))}
            />
            <NeumorphicButton variant="primary" loading={loading} onClick={save}>
              Save changes
            </NeumorphicButton>
          </div>
        ) : (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth" value={profile.dateOfBirth} />
            <Field label="Primary email" value={profile.primaryEmail} />
            <Field label="Primary phone" value={profile.primaryPhone} />
            <Field label="Alternative email" value={profile.alternativeEmail || '—'} />
            <Field label="Alternative phone" value={profile.alternativePhone || '—'} />
            <Field label="Onboarding completed" value={profile.onboardingCompleted ? 'Yes' : 'No'} />
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
