import type { BulkUploadCredentials } from '@/lib/members-api';

const KEY_PREFIX = 'neurolxp-bulk-credentials-';
const LATEST_ID_KEY = 'neurolxp-latest-bulk-upload-id';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidBulkUploadId(id: string | null | undefined): id is string {
  return Boolean(id && id !== 'undefined' && id !== 'null' && UUID_RE.test(id));
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore quota errors */
  }
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveBulkCredentials(bulkUploadId: string, data: BulkUploadCredentials) {
  if (!isValidBulkUploadId(bulkUploadId)) return;
  writeStorage(`${KEY_PREFIX}${bulkUploadId}`, JSON.stringify(data));
  writeStorage(LATEST_ID_KEY, bulkUploadId);
}

export function loadBulkCredentials(bulkUploadId: string): BulkUploadCredentials | null {
  if (!isValidBulkUploadId(bulkUploadId)) return null;
  try {
    const raw = readStorage(`${KEY_PREFIX}${bulkUploadId}`);
    if (!raw) return null;
    return JSON.parse(raw) as BulkUploadCredentials;
  } catch {
    return null;
  }
}

export function getLatestBulkUploadId(): string | null {
  const id = readStorage(LATEST_ID_KEY);
  return isValidBulkUploadId(id) ? id : null;
}

export function loadLatestBulkCredentials(): BulkUploadCredentials | null {
  const id = getLatestBulkUploadId();
  return id ? loadBulkCredentials(id) : null;
}
