import type { AxiosInstance } from 'axios';
import { apiClient as superAdminClient } from '@/superadmin/lib/axios';
import { platformApiClient } from '@/platform-admin/lib/axios';

export type TenantRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
  country: string;
  state: string;
  city: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  alternateContactPersonName: string | null;
  alternateContactEmail: string | null;
  alternateContactMobile: string | null;
  platformPurpose: string;
  programmeCategory: string;
  programmesOffered: string;
  expectedUsers: string;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  moduleConfiguration: {
    profilingTenantTypes: string[];
    selectedModules: string[];
  } | null;
};

export type CreateTenantPayload = {
  tenantId: string;
  tenantName: string;
  tenantType: string;
  country: string;
  state: string;
  city: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  alternateContactPersonName?: string;
  alternateContactEmail?: string;
  alternateContactMobile?: string;
  platformPurpose: string;
  programmeCategory: string;
  programmesOffered: string;
  expectedUsers: string;
  subscriptionPlan: string;
  status: string;
};

export type SaveTenantConfigurationPayload = {
  tenantName: string;
  tenantType: string;
  profilingTenantTypes: string[];
  selectedModules: string[];
};

export type TenantPortal = 'superadmin' | 'platform-admin';

function clientFor(portal: TenantPortal): AxiosInstance {
  return portal === 'superadmin' ? superAdminClient : platformApiClient;
}

export function createTenantsApi(portal: TenantPortal) {
  const client = clientFor(portal);

  return {
    createTenant: (data: CreateTenantPayload) =>
      client.post<TenantRecord>('/api/tenants', data),
    listTenants: () => client.get<TenantRecord[]>('/api/tenants'),
    getTenant: (tenantId: string) => client.get<TenantRecord>(`/api/tenants/${tenantId}`),
    getNextTenantId: (tenantType: string) =>
      client.get<{ tenantId: string; tenantType: string }>(
        `/api/tenants/next-id/${encodeURIComponent(tenantType)}`,
      ),
    saveConfiguration: (tenantId: string, data: SaveTenantConfigurationPayload) =>
      client.put(`/api/tenants/${tenantId}/configuration`, data),
  };
}

/** Display labels for auto-generated tenant ID prefixes */
export const TENANT_ID_PREFIX_HINT: Record<string, string> = {
  UNIVERSITY: 'LXP-UNI-###',
  COLLEGE: 'LXP-COL-###',
  CORPORATE: 'LXP-COR-###',
  SKILL_ACADEMY: 'LXP-SKL-###',
  NGO: 'LXP-NGO-###',
  GOVERNMENT: 'LXP-GOV-###',
  BOOTCAMP: 'LXP-BTC-###',
  SCHOOL: 'LXP-SCH-###',
};

export const TENANT_CONFIG_STORAGE_KEY = 'tenant_configuration';

export function saveTenantConfigurationDraft(data: {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_CONFIG_STORAGE_KEY, JSON.stringify(data));
}

export function loadTenantConfigurationDraft():
  | { tenantId: string; tenantName: string; tenantType: string }
  | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TENANT_CONFIG_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { tenantId: string; tenantName: string; tenantType: string };
  } catch {
    return null;
  }
}
