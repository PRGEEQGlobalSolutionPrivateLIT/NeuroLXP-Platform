'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { MemberAvatar } from '@/member/components/MemberAvatar';
import { useMemberAuthStore } from '@/member/store/auth.store';
import { membersApi } from '@/lib/members-api';
import { setStoredMemberAvatar } from '@/member/lib/member-avatar';
import {
  csvFieldLabel,
  EMPTY_STUDENT_SUPPLEMENT,
  normalizeStudentSupplement,
  type StudentProfileSupplement,
} from '@/lib/student-profile-supplement';
import neoToast from '@/lib/toast';

type StudentProfile = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  tenantId: string | null;
  tenantName: string | null;
  csvProfile?: Record<string, string>;
  studentSupplement?: StudentProfileSupplement;
  onboardingCompleted: boolean;
};

const CSV_DISPLAY_ORDER = [
  'tenant_id',
  'tenant_name',
  'registration_or_user_id',
  'full_name',
  'email',
  'mobile',
  'gender',
  'date_of_birth',
  'academic_year',
  'expected_passout_year',
  'onboarding_date',
  'department_branch_specialization',
  'current_year_of_study',
];

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="neo-inset rounded-xl px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--neo-text)]">{value || '—'}</dd>
    </div>
  );
}

function YesNoRadio({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: 'yes' | 'no';
  onChange: (v: 'yes' | 'no') => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {(['yes', 'no'] as const).map((opt) => (
        <label
          key={opt}
          className={clsx(
            'flex cursor-pointer items-center gap-2 text-sm font-medium',
            disabled && 'cursor-not-allowed opacity-70',
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            disabled={disabled}
            onChange={() => onChange(opt)}
            className="h-4 w-4 accent-[var(--neo-primary)]"
          />
          {opt === 'yes' ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  );
}

export function StudentMemberProfilePage() {
  const { user } = useMemberAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplement, setSupplement] = useState<StudentProfileSupplement>(EMPTY_STUDENT_SUPPLEMENT);

  const loadProfile = () => {
    if (!user?.memberId) return;
    membersApi
      .getProfile(user.memberId)
      .then(({ data }) => {
        const p = data as StudentProfile;
        setProfile(p);
        setSupplement(normalizeStudentSupplement(p.studentSupplement));
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
      const normalized = normalizeStudentSupplement(supplement);
      await membersApi.updateProfile(user.memberId, { studentSupplement: normalized });
      neoToast.success('Additional profile details saved');
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

  const csv = { ...(profile.csvProfile ?? {}) };
  if (profile.tenantId && !csv.tenant_id) csv.tenant_id = profile.tenantId;
  if (profile.tenantName && !csv.tenant_name) csv.tenant_name = profile.tenantName;
  if (profile.userId && !csv.registration_or_user_id) {
    /* keep registration from employee id in csv */
  }

  const csvKeys = [
    ...CSV_DISPLAY_ORDER.filter((k) => csv[k] !== undefined && csv[k] !== ''),
    ...Object.keys(csv).filter((k) => !CSV_DISPLAY_ORDER.includes(k) && csv[k]),
  ];

  const uniqueCsvKeys = [...new Set(csvKeys)];

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
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">
                User ID
              </p>
            )}
            {profile.userId && (
              <p className="font-mono text-sm font-bold text-[var(--neo-primary)]">{profile.userId}</p>
            )}
            {profile.tenantId && (
              <p className="mt-1 font-mono text-xs text-[var(--neo-muted)]">
                Tenant: <span className="font-semibold text-[var(--neo-text)]">{profile.tenantId}</span>
                {profile.tenantName ? ` · ${profile.tenantName}` : ''}
              </p>
            )}
            <h3 className="mt-2 text-xl font-bold text-[var(--neo-text)]">{profile.fullName}</h3>
            <p className="text-sm capitalize text-[var(--neo-muted)]">Student</p>
            <p className="text-sm text-[var(--neo-muted)]">{profile.email}</p>
          </div>
          <NeumorphicButton
            className="sm:ml-auto"
            onClick={() => {
              if (editing) {
                setSupplement(normalizeStudentSupplement(profile.studentSupplement));
              }
              setEditing((e) => !e);
            }}
          >
            {editing ? 'Cancel' : 'Edit additional details'}
          </NeumorphicButton>
        </div>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-[var(--neo-text)]">Institution profile (from CSV)</h2>
          <p className="mt-1 text-xs text-[var(--neo-muted)]">
            These details were provided during registration and cannot be changed here.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {uniqueCsvKeys.map((key) => (
              <ReadOnlyField key={key} label={csvFieldLabel(key)} value={csv[key]} />
            ))}
            {!uniqueCsvKeys.length && (
              <p className="text-sm text-[var(--neo-muted)] sm:col-span-2">
                No CSV profile data on file yet.
              </p>
            )}
          </dl>
        </section>

        <section className="mt-8 border-t border-[var(--neo-border)] pt-8">
          <h2 className="text-lg font-bold text-[var(--neo-text)]">Additional details</h2>
          <p className="mt-1 text-xs text-[var(--neo-muted)]">
            You can add or update the fields below. Institution CSV data stays read-only.
          </p>

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
                label="What's your feature goal?"
                value={supplement.feature_goal}
                onChange={(e) => setSupplement((s) => ({ ...s, feature_goal: e.target.value }))}
              />

              <NeumorphicInput
                label="Project title"
                value={supplement.project_title}
                onChange={(e) => setSupplement((s) => ({ ...s, project_title: e.target.value }))}
              />

              <div className="neo-inset rounded-xl px-4 py-4">
                <p className="text-sm font-semibold text-[var(--neo-text)]">
                  Did you attend any hackathons?
                </p>
                <div className="mt-3">
                  <YesNoRadio
                    name="attended_hackathon"
                    value={supplement.attended_hackathon}
                    onChange={(v) =>
                      setSupplement((s) =>
                        normalizeStudentSupplement({ ...s, attended_hackathon: v }),
                      )
                    }
                  />
                </div>
              </div>

              {supplement.attended_hackathon === 'yes' && (
                <>
                  <NeumorphicInput
                    label="Title of hackathon"
                    value={supplement.hackathon_title}
                    onChange={(e) => setSupplement((s) => ({ ...s, hackathon_title: e.target.value }))}
                  />
                  <NeumorphicInput
                    label="Team size"
                    type="number"
                    min={1}
                    value={supplement.hackathon_team_size}
                    onChange={(e) =>
                      setSupplement((s) => ({ ...s, hackathon_team_size: e.target.value }))
                    }
                  />
                  <div className="neo-inset rounded-xl px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--neo-text)]">Did you win a prize?</p>
                    <div className="mt-3">
                      <YesNoRadio
                        name="won_prize"
                        value={supplement.won_prize}
                        onChange={(v) =>
                          setSupplement((s) => normalizeStudentSupplement({ ...s, won_prize: v }))
                        }
                      />
                    </div>
                  </div>
                  {supplement.won_prize === 'yes' && (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--neo-text)]">
                          Place
                        </label>
                        <select
                          className="neo-input w-full"
                          value={supplement.prize_place}
                          onChange={(e) =>
                            setSupplement((s) => ({
                              ...s,
                              prize_place: e.target.value as StudentProfileSupplement['prize_place'],
                            }))
                          }
                        >
                          <option value="">Select place</option>
                          <option value="1st">1st</option>
                          <option value="2nd">2nd</option>
                          <option value="3rd">3rd</option>
                        </select>
                      </div>
                      <NeumorphicInput
                        label="Cash prize (amount)"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={supplement.cash_prize}
                        onChange={(e) =>
                          setSupplement((s) => ({
                            ...s,
                            cash_prize: e.target.value.replace(/\D/g, ''),
                          }))
                        }
                      />
                    </>
                  )}
                </>
              )}

              <NeumorphicButton variant="primary" loading={loading} onClick={save}>
                Save additional details
              </NeumorphicButton>
            </div>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Feature goal" value={supplement.feature_goal || '—'} />
              <ReadOnlyField label="Project title" value={supplement.project_title || '—'} />
              <ReadOnlyField
                label="Attended hackathons"
                value={supplement.attended_hackathon === 'yes' ? 'Yes' : 'No'}
              />
              {supplement.attended_hackathon === 'yes' && (
                <>
                  <ReadOnlyField label="Hackathon title" value={supplement.hackathon_title || '—'} />
                  <ReadOnlyField label="Team size" value={supplement.hackathon_team_size || '—'} />
                  <ReadOnlyField
                    label="Won prize"
                    value={supplement.won_prize === 'yes' ? 'Yes' : 'No'}
                  />
                  {supplement.won_prize === 'yes' && (
                    <>
                      <ReadOnlyField label="Place" value={supplement.prize_place || '—'} />
                      <ReadOnlyField
                        label="Cash prize"
                        value={supplement.cash_prize ? `₹${supplement.cash_prize}` : '—'}
                      />
                    </>
                  )}
                </>
              )}
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
