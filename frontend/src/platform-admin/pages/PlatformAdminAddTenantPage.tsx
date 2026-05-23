'use client';

import { RegisterTenantForm } from '@/tenant/components/RegisterTenantForm';

export function PlatformAdminAddTenantPage() {
  return <RegisterTenantForm basePath="/platform-admin" portal="platform-admin" />;
}
