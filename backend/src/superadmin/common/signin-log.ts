import { Prisma } from '@prisma/client';

export interface SigninLogEntry {
  timestamp: string;
  action: string;
  method: string;
  status: 'success' | 'failed';
  ipAddress?: string;
  deviceInfo?: string;
}

export function appendSigninLog(
  existing: Prisma.JsonValue,
  entry: SigninLogEntry,
): SigninLogEntry[] {
  const logs = Array.isArray(existing) ? (existing as unknown as SigninLogEntry[]) : [];
  return [...logs, entry];
}
