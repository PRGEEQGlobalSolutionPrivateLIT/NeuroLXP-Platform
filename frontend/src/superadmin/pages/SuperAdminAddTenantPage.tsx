'use client';

import { RegisterTenantForm } from '@/tenant/components/RegisterTenantForm';

export function SuperAdminAddTenantPage() {
  return <RegisterTenantForm basePath="/superadmin" portal="superadmin" />;
}
