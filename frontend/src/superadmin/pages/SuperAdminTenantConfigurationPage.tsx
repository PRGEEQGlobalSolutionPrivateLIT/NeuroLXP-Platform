'use client';

import { TenantConfigurationForm } from '@/tenant/components/TenantConfigurationForm';

export function SuperAdminTenantConfigurationPage() {
  return <TenantConfigurationForm basePath="/superadmin" />;
}
