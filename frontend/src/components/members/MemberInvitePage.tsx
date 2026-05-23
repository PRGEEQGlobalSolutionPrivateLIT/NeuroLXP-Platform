'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import neoToast from '@/lib/toast';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { parseMemberCsv, MEMBER_CSV_TEMPLATE, MEMBER_CSV_COLUMN_HELP, ParsedCsvRow } from '@/lib/csv-parse';
import { membersApi, MemberRole, CsvRowPayload } from '@/lib/members-api';
import { StudentBulkCsvUpload } from '@/components/members/StudentBulkCsvUpload';

type Mode = 'choose' | 'single' | 'csv' | 'csv_preview' | 'student_bulk' | 'done';
type ValidatedRow = CsvRowPayload & { errors: string[]; warnings: string[]; valid: boolean };

const ROLE_LABELS: Record<MemberRole, string> = {
  coordinator: 'Coordinator',
  faculty: 'Faculty',
  student: 'Student',
};

interface Props {
  role: MemberRole;
  backHref: string;
  createdByType: 'platform_admin' | 'institution_admin' | 'super_admin';
  createdById?: string;
  onBulkComplete?: (bulkUploadId: string) => void;
}

export function MemberInvitePage({ role, backHref, createdByType, createdById, onBulkComplete }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [loading, setLoading] = useState(false);
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [canUpload, setCanUpload] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ succeeded: number; failed: number } | null>(null);
  const [devInfo, setDevInfo] = useState<{ devMagicLink?: string; tempPassword?: string } | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleLabel = ROLE_LABELS[role];

  const toPayload = (r: ParsedCsvRow | ValidatedRow): CsvRowPayload => ({
    rowIndex: r.rowIndex,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    department: r.department,
    employeeId: r.employeeId,
    extra: 'extra' in r ? r.extra : {},
  });

  const runValidation = useCallback(
    async (parsed: ParsedCsvRow[]) => {
      const payloads = parsed.map(toPayload);
      const { data } = await membersApi.validateCsv(role, payloads);
      setRows(data.rows);
      setCanUpload(data.canUpload);
      return data;
    },
    [role],
  );

  const handleFile = async (file: File) => {
    setSelectedFileName(file.name);
    const text = await file.text();
    const parsed = parseMemberCsv(text);
    if (!parsed.length) {
      neoToast.error('CSV is empty or invalid — check headers and save as .csv');
      return;
    }
    setLoading(true);
    try {
      await runValidation(parsed);
      setMode('csv_preview');
      neoToast.success(`Parsed ${parsed.length} rows — review before upload`);
    } catch {
      neoToast.error('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';
  };

  const updateRow = (rowIndex: number, patch: Partial<CsvRowPayload>) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.rowIndex === rowIndex ? { ...r, ...patch } : r));
      return next;
    });
  };

  const revalidate = async () => {
    setLoading(true);
    try {
      const { data } = await membersApi.validateCsv(role, rows.map(toPayload));
      setRows(data.rows);
      setCanUpload(data.canUpload);
      if (!data.canUpload) neoToast.error('Fix errors in highlighted rows');
      else neoToast.success('All rows valid — you can upload');
    } catch {
      neoToast.error('Re-validation failed');
    } finally {
      setLoading(false);
    }
  };

  const submitSingle = async () => {
    if (!singleName.trim() || !singleEmail.trim()) {
      neoToast.error('Name and email are required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await membersApi.inviteSingle({
        role,
        fullName: singleName,
        email: singleEmail,
        createdByType,
        createdById,
      });
      setDevInfo({ devMagicLink: data.devMagicLink, tempPassword: data.tempPassword });
      neoToast.success(`Invitation sent to ${singleEmail}`);
      setMode('done');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Invite failed');
    } finally {
      setLoading(false);
    }
  };

  const submitBulk = async () => {
    if (!canUpload) {
      neoToast.error('Resolve all row errors before uploading');
      return;
    }
    setLoading(true);
    try {
      const { data } = await membersApi.inviteBulk({
        role,
        rows: rows.map(toPayload),
        createdByType,
        createdById,
      });
      setBulkResult({ succeeded: data.succeeded, failed: data.failed });
      neoToast.success(`Uploaded ${data.succeeded} of ${data.total}`);
      setMode('done');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const step = mode === 'choose' ? 1 : mode === 'done' ? 3 : 2;

  return (
    <StepLayout
      mode="signup"
      currentStep={step}
      totalSteps={3}
      title={`Add ${roleLabel}`}
      subtitle="CSV bulk upload or single invitation with email credentials"
      backHref={backHref}
      footer={
        mode === 'choose' ? null : mode === 'single' ? (
          <NeumorphicButton variant="primary" loading={loading} onClick={submitSingle}>
            Send invitation & credentials
          </NeumorphicButton>
        ) : mode === 'csv_preview' ? (
          <div className="flex flex-wrap gap-2">
            <NeumorphicButton loading={loading} onClick={revalidate}>
              Re-validate
            </NeumorphicButton>
            <NeumorphicButton variant="primary" loading={loading} disabled={!canUpload} onClick={submitBulk}>
              Upload {rows.length} members
            </NeumorphicButton>
          </div>
        ) : mode === 'done' ? (
          <NeumorphicButton variant="primary" onClick={() => router.push(backHref)}>
            Back to dashboard
          </NeumorphicButton>
        ) : null
      }
    >
      {mode === 'choose' && (
        <div className="space-y-4">
          {role === 'student' ? (
            <>
              <NeumorphicButton variant="primary" className="w-full" onClick={() => setMode('student_bulk')}>
                Bulk upload (CSV)
              </NeumorphicButton>
              <NeumorphicButton className="w-full" onClick={() => setMode('single')}>
                Single upload (name & email)
              </NeumorphicButton>
            </>
          ) : (
            <>
              <NeumorphicButton variant="primary" className="w-full" onClick={() => setMode('csv')}>
                CSV bulk upload
              </NeumorphicButton>
              <NeumorphicButton className="w-full" onClick={() => setMode('single')}>
                Single upload (name & email)
              </NeumorphicButton>
            </>
          )}
        </div>
      )}

      {mode === 'student_bulk' && (
        <StudentBulkCsvUpload
          createdByType={createdByType}
          createdById={createdById}
          onBack={() => setMode('choose')}
          onComplete={(bulkUploadId) => {
            if (onBulkComplete) onBulkComplete(bulkUploadId);
            else router.push(`${backHref}?bulkUpload=${bulkUploadId}`);
          }}
        />
      )}

      {mode === 'single' && (
        <>
          <NeumorphicInput label="Full name" value={singleName} onChange={(e) => setSingleName(e.target.value)} />
          <NeumorphicInput
            label="Email"
            type="email"
            value={singleEmail}
            onChange={(e) => setSingleEmail(e.target.value)}
          />
          <p className="text-xs text-[var(--neo-muted)]">
            A temporary password and magic sign-in link will be emailed. They must change credentials after first login.
          </p>
        </>
      )}

      {mode === 'csv' && (
        <>
          <NeumorphicCard className="!p-4 text-xs">
            <p className="font-semibold text-[var(--neo-text)]">CSV format</p>
            <p className="mt-1 whitespace-pre-line text-[var(--neo-muted)]">{MEMBER_CSV_COLUMN_HELP}</p>
            <pre className="mt-3 overflow-x-auto rounded bg-[var(--neo-bg)] p-2 text-[10px]">{MEMBER_CSV_TEMPLATE}</pre>
          </NeumorphicCard>
          <div className="neo-card flex flex-col items-center gap-3 !p-6">
            <span className="text-sm font-medium text-[var(--neo-text)]">Select CSV file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="sr-only"
              onChange={onFileInputChange}
            />
            <NeumorphicButton
              type="button"
              variant="primary"
              loading={loading}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse file
            </NeumorphicButton>
            {selectedFileName && (
              <p className="text-xs text-[var(--neo-muted)]">Selected: {selectedFileName}</p>
            )}
          </div>
          <NeumorphicButton onClick={() => setMode('choose')}>Back</NeumorphicButton>
        </>
      )}

      {mode === 'csv_preview' && (
        <div className="space-y-4">
          {!canUpload && (
            <div className="neo-alert neo-alert--warning text-sm">
              Fix all rows with errors (name, email, phone required). Blank optional fields: use NA.
            </div>
          )}
          <div className="max-h-[420px] overflow-auto rounded-lg border border-[var(--neo-border)]">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="sticky top-0 bg-[var(--neo-card)]">
                <tr>
                  <th className="p-2">Row</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Dept / Branch</th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.rowIndex}
                    className={r.valid ? '' : 'bg-red-500/10'}
                  >
                    <td className="p-2">{r.rowIndex}</td>
                    <td className="p-2">
                      <input
                        className="neo-input w-full min-w-[100px]"
                        value={r.fullName}
                        onChange={(e) => updateRow(r.rowIndex, { fullName: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="neo-input w-full min-w-[120px]"
                        value={r.email}
                        onChange={(e) => updateRow(r.rowIndex, { email: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="neo-input w-full min-w-[90px]"
                        value={r.phone}
                        onChange={(e) => updateRow(r.rowIndex, { phone: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="neo-input w-full"
                        value={r.department ?? ''}
                        onChange={(e) => updateRow(r.rowIndex, { department: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        className="neo-input w-full min-w-[70px]"
                        value={r.employeeId ?? ''}
                        onChange={(e) => updateRow(r.rowIndex, { employeeId: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      {r.errors.length > 0 && (
                        <ul className="text-red-600">
                          {r.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {r.warnings.map((w) => (
                        <p key={w} className="text-amber-600">
                          {w}
                        </p>
                      ))}
                      {r.valid && r.warnings.length === 0 && <span className="text-green-600">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <NeumorphicButton onClick={() => setMode('csv')}>Choose another file</NeumorphicButton>
        </div>
      )}

      {mode === 'done' && (
        <NeumorphicCard highlight className="!p-5 space-y-3 text-sm">
          <p>Invitations sent with login credentials by email.</p>
          {bulkResult && (
            <p>
              Bulk: {bulkResult.succeeded} succeeded, {bulkResult.failed} failed.
            </p>
          )}
          {devInfo?.tempPassword && (
            <p className="font-mono text-xs break-all">
              Dev temp password: {devInfo.tempPassword}
              {devInfo.devMagicLink && (
                <>
                  <br />
                  Magic link: {devInfo.devMagicLink}
                </>
              )}
            </p>
          )}
          <p className="text-[var(--neo-muted)]">
            Members must sign in and change password before using the dashboard.
          </p>
        </NeumorphicCard>
      )}
    </StepLayout>
  );
}
