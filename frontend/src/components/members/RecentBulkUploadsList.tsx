'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { membersApi, type BulkUploadSummary } from '@/lib/members-api';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

type Props = {
  basePath: '/platform-admin' | '/superadmin';
  uploadedByType?: string;
};

export function RecentBulkUploadsList({ basePath, uploadedByType }: Props) {
  const router = useRouter();
  const [uploads, setUploads] = useState<BulkUploadSummary[]>([]);

  useEffect(() => {
    membersApi
      .listRecentBulkUploads(uploadedByType)
      .then(({ data }) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]));
  }, [uploadedByType]);

  if (!uploads.length) return null;

  return (
    <section className="neo-card p-6">
      <h2 className="text-lg font-bold text-[var(--neo-text)]">Recent student bulk uploads</h2>
      <p className="mt-1 text-sm text-[var(--neo-muted)]">
        Open a past upload to view student credentials (User ID, password, sign-in link).
      </p>
      <ul className="mt-4 space-y-2">
        {uploads.map((job) => (
          <li
            key={job.id}
            className="neo-inset flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
          >
            <div>
              <p className="font-semibold text-[var(--neo-text)]">
                {job.succeeded} students · {new Date(job.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-[var(--neo-muted)]">
                {job.tenant_name || 'No tenant'}
                {job.file_name ? ` · ${job.file_name}` : ''}
              </p>
            </div>
            <NeumorphicButton
              variant="primary"
              onClick={() => router.push(`${basePath}/add-members?bulkUpload=${job.id}`)}
            >
              View credentials
            </NeumorphicButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
