import { BadRequestException } from '@nestjs/common';

/** LXP-{TYPE_CODE}-{NNN} — increment NNN per tenant type */
export const TENANT_TYPE_CODES: Record<string, string> = {
  UNIVERSITY: 'UNI',
  COLLEGE: 'COL',
  CORPORATE: 'COR',
  SKILL_ACADEMY: 'SKL',
  NGO: 'NGO',
  GOVERNMENT: 'GOV',
  BOOTCAMP: 'BTC',
  SCHOOL: 'SCH',
};

export function getTenantTypeCode(tenantType: string): string {
  const code = TENANT_TYPE_CODES[tenantType];
  if (!code) {
    throw new BadRequestException(`Unsupported tenant type: ${tenantType}`);
  }
  return code;
}

export function buildTenantIdPrefix(tenantType: string): string {
  return `LXP-${getTenantTypeCode(tenantType)}-`;
}

export function formatTenantId(tenantType: string, sequence: number): string {
  return `${buildTenantIdPrefix(tenantType)}${String(sequence).padStart(3, '0')}`;
}

export function parseTenantIdSequence(tenantId: string, prefix: string): number | null {
  if (!tenantId.startsWith(prefix)) return null;
  const suffix = tenantId.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return null;
  return parseInt(suffix, 10);
}
