import { LxpMember } from '@prisma/client';

const RESERVED_EXTRA_KEYS = new Set(['tenant_id', 'tenant_name', 'student_supplement', 'department', 'employee_id']);

export type StudentSupplement = {
  feature_goal: string;
  attended_hackathon: 'yes' | 'no';
  hackathon_title: string;
  hackathon_team_size: string;
  won_prize: 'yes' | 'no';
  prize_place: '' | '1st' | '2nd' | '3rd';
  cash_prize: string;
  project_title: string;
};

export function asExtraRecord(extra: unknown): Record<string, unknown> {
  if (typeof extra === 'object' && extra !== null && !Array.isArray(extra)) {
    return extra as Record<string, unknown>;
  }
  return {};
}

export function normalizeStudentSupplement(raw: unknown): StudentSupplement {
  const o = asExtraRecord(raw);
  const attended = o.attended_hackathon === 'yes' ? 'yes' : 'no';
  const won = o.won_prize === 'yes' ? 'yes' : 'no';
  const place = o.prize_place === '1st' || o.prize_place === '2nd' || o.prize_place === '3rd' ? o.prize_place : '';
  const cash = String(o.cash_prize ?? '').replace(/\D/g, '');

  return {
    feature_goal: String(o.feature_goal ?? '').trim(),
    attended_hackathon: attended,
    hackathon_title: attended === 'yes' ? String(o.hackathon_title ?? '').trim() : '',
    hackathon_team_size: attended === 'yes' ? String(o.hackathon_team_size ?? '').trim() : '',
    won_prize: attended === 'yes' ? won : 'no',
    prize_place: attended === 'yes' && won === 'yes' ? place : '',
    cash_prize: attended === 'yes' && won === 'yes' ? cash : '',
    project_title: String(o.project_title ?? '').trim(),
  };
}

export function buildCsvProfileData(member: LxpMember): Record<string, string> {
  const extra = asExtraRecord(member.extra_data);
  const csv: Record<string, string> = {
    registration_or_user_id: member.employee_id?.trim() || '',
    full_name: member.full_name,
    email: member.email,
    mobile: member.phone?.trim() || '',
    department_branch_specialization: member.department?.trim() || '',
  };

  for (const [key, value] of Object.entries(extra)) {
    if (RESERVED_EXTRA_KEYS.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') continue;
    csv[key] = String(value).trim();
  }

  if (extra.tenant_id) csv.tenant_id = String(extra.tenant_id);
  if (extra.tenant_name) csv.tenant_name = String(extra.tenant_name);

  return csv;
}

export function mergeExtraWithTenant(
  extra: Record<string, string>,
  tenantId?: string,
  tenantName?: string,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...extra };
  if (tenantId) merged.tenant_id = tenantId;
  if (tenantName) merged.tenant_name = tenantName;
  const existingSupplement = asExtraRecord(merged.student_supplement);
  if (!merged.student_supplement) {
    merged.student_supplement = normalizeStudentSupplement(existingSupplement);
  }
  return merged;
}
