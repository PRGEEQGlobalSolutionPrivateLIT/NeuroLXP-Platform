import type { BulkUploadCredentials } from '@/lib/members-api';
import { isValidBulkUploadId } from '@/lib/bulk-credentials-cache';

type BulkInviteRow = {
  rowIndex: number;
  email: string;
  success?: boolean;
  error?: string;
  userId?: string;
  tempPassword?: string;
  magicLink?: string;
  reinvited?: boolean;
};

type BulkInviteCredential = {
  rowIndex: number;
  fullName: string;
  email: string;
  userId?: string;
  tempPassword: string;
  magicLink: string;
  memberId?: string;
};

export type BulkInviteFailure = {
  rowIndex: number;
  email: string;
  error: string;
};

export type ParsedBulkInvite = {
  bulkUploadId: string | null;
  total: number;
  succeeded: number;
  failed: number;
  reinvited: number;
  credentials: BulkInviteCredential[];
  failures: BulkInviteFailure[];
};

export function parseBulkInviteResponse(data: unknown): ParsedBulkInvite {
  const body = data as Record<string, unknown>;
  const rawId = body.bulkUploadId ?? body.bulk_upload_id;
  const bulkUploadId = isValidBulkUploadId(String(rawId ?? '')) ? String(rawId) : null;

  const credentials = Array.isArray(body.credentials)
    ? (body.credentials as BulkInviteCredential[])
    : [];

  const results = Array.isArray(body.results) ? (body.results as BulkInviteRow[]) : [];

  const failures: BulkInviteFailure[] = results
    .filter((r) => !r.success)
    .map((r) => ({
      rowIndex: r.rowIndex,
      email: r.email,
      error: r.error || 'Import failed',
    }));

  const reinvited = results.filter((r) => r.success && r.reinvited).length;

  const mergedCredentials =
    credentials.length > 0
      ? credentials
      : results
          .filter((r) => r.success && r.tempPassword && r.magicLink)
          .map((r) => ({
            rowIndex: r.rowIndex,
            fullName: r.email,
            email: r.email,
            userId: r.userId,
            tempPassword: r.tempPassword!,
            magicLink: r.magicLink!,
          }));

  return {
    bulkUploadId,
    total: Number(body.total ?? 0),
    succeeded: Number(body.succeeded ?? 0),
    failed: Number(body.failed ?? failures.length),
    reinvited,
    credentials: mergedCredentials,
    failures,
  };
}

export function formatBulkInviteToast(parsed: ParsedBulkInvite): string {
  if (parsed.succeeded === 0) {
    const sample = parsed.failures
      .slice(0, 2)
      .map((f) => `${f.email}: ${f.error}`)
      .join('; ');
    return sample
      ? `0 students imported. ${parsed.failed} failed — ${sample}`
      : `0 students imported. All ${parsed.failed} row(s) failed.`;
  }
  const reinvitedNote =
    parsed.reinvited > 0 ? ` (${parsed.reinvited} existing — credentials re-sent)` : '';
  const failedNote = parsed.failed > 0 ? `, ${parsed.failed} failed` : '';
  return `Imported ${parsed.succeeded} students${reinvitedNote}${failedNote} — credentials emailed`;
}

export function buildBulkCredentialsCache(
  bulkUploadId: string,
  parsed: ParsedBulkInvite,
  meta: {
    tenantId?: string | null;
    tenantName?: string | null;
    fileName?: string | null;
  },
): BulkUploadCredentials {
  return {
    id: bulkUploadId,
    role: 'student',
    tenantId: meta.tenantId ?? null,
    tenantName: meta.tenantName ?? null,
    fileName: meta.fileName ?? null,
    totalRows: parsed.total,
    succeeded: parsed.succeeded,
    failed: parsed.failed,
    createdAt: new Date().toISOString(),
    credentials: parsed.credentials.map((c, i) => ({
      id: `${bulkUploadId}-${i}`,
      rowIndex: c.rowIndex,
      fullName: c.fullName,
      email: c.email,
      userId: c.userId ?? null,
      tempPassword: c.tempPassword,
      magicLink: c.magicLink,
      emailSent: true,
    })),
    failures: parsed.failures,
  };
}
