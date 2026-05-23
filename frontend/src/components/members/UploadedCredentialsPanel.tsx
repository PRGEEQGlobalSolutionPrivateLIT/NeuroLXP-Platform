'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { membersApi, type BulkUploadCredentials } from '@/lib/members-api';
import {
  getLatestBulkUploadId,
  isValidBulkUploadId,
  loadBulkCredentials,
  loadLatestBulkCredentials,
  saveBulkCredentials,
} from '@/lib/bulk-credentials-cache';
import neoToast from '@/lib/toast';

type Props = {
  bulkUploadId: string;
  title?: string;
  fixUrlBasePath?: '/platform-admin' | '/superadmin';
};

export function UploadedCredentialsPanel({ bulkUploadId, title, fixUrlBasePath }: Props) {
  const router = useRouter();
  const [data, setData] = useState<BulkUploadCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolvedId = isValidBulkUploadId(bulkUploadId) ? bulkUploadId : null;

  useEffect(() => {
    let cancelled = false;

    if (!resolvedId) {
      const latest = loadLatestBulkCredentials();
      if (latest && fixUrlBasePath) {
        const latestId = getLatestBulkUploadId();
        if (latestId) {
          router.replace(`${fixUrlBasePath}/add-members?bulkUpload=${latestId}`);
          return;
        }
      }
      setLoadError('Invalid upload link. Choose a recent upload below.');
      setLoading(false);
      return;
    }

    const cached = loadBulkCredentials(resolvedId);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setLoadError(null);

    membersApi
      .getBulkUploadCredentials(resolvedId)
      .then(({ data: res }) => {
        if (cancelled) return;
        setData(res);
        saveBulkCredentials(resolvedId, res);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not load from server';
        if (!cached) {
          const latest = loadLatestBulkCredentials();
          if (latest && latest.id === resolvedId) {
            setData(latest);
            setLoadError(`${msg} — showing saved copy from this browser.`);
          } else {
            setLoadError(msg);
            neoToast.error('Could not load uploaded credentials from server.');
          }
        } else {
          setLoadError(`${msg} — showing saved copy from this browser.`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedId, fixUrlBasePath, router, bulkUploadId]);

  if (loading && !data) {
    return (
      <section className="neo-card p-6">
        <p className="text-sm text-[var(--neo-muted)]">Loading uploaded credentials…</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section id={`bulk-upload-${bulkUploadId}`} className="neo-card p-6 scroll-mt-24">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">Uploaded student credentials</h2>
        <p className="mt-2 text-sm text-red-600">
          {loadError || 'Credentials not found for this upload.'}
        </p>
        <p className="mt-2 text-xs text-[var(--neo-muted)]">
          If you just imported students, use <strong>Recent student bulk uploads</strong> below, or
          upload the CSV again.
        </p>
      </section>
    );
  }

  return (
    <section id={`bulk-upload-${data.id}`} className="neo-card overflow-hidden p-0 scroll-mt-24">
      <div className="border-b border-[var(--neo-border)] p-6">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">
          {title ?? 'Uploaded student credentials'}
        </h2>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          {data.succeeded} of {data.totalRows} students created
          {data.tenantName ? ` · Tenant: ${data.tenantName}` : ''}
          {data.fileName ? ` · File: ${data.fileName}` : ''}
        </p>
        <p className="mt-2 text-xs text-[var(--neo-muted)]">
          Credentials were emailed to each student. Verify User ID, password, and sign-in link below.
        </p>
        {loadError && <p className="mt-2 text-xs text-amber-600">{loadError}</p>}
      </div>

      {data.failures && data.failures.length > 0 && (
        <div className="border-b border-[var(--neo-border)] bg-red-500/5 p-6">
          <h3 className="text-sm font-bold text-red-600">Rows that did not import</h3>
          <ul className="mt-2 space-y-1 text-xs text-[var(--neo-muted)]">
            {data.failures.map((f) => (
              <li key={`${f.rowIndex}-${f.email}`}>
                Row {f.rowIndex}: {f.email} — {f.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[var(--neo-border)] bg-[var(--neo-surface)]">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">User ID</th>
              <th className="px-4 py-3 font-semibold">Password</th>
              <th className="px-4 py-3 font-semibold">Sign-in link</th>
            </tr>
          </thead>
          <tbody>
            {data.credentials.map((c) => (
              <tr key={c.id} className="border-b border-[var(--neo-border)] last:border-0">
                <td className="px-4 py-3">{c.rowIndex}</td>
                <td className="px-4 py-3">{c.fullName}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.userId ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.tempPassword}</td>
                <td className="px-4 py-3">
                  <a
                    href={c.magicLink}
                    className="break-all text-xs text-[var(--neo-primary)] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open magic link
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
