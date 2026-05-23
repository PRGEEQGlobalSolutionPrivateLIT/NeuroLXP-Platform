'use client';

import { ViewTenantsList } from '@/tenant/components/ViewTenantsList';

export function SuperAdminViewTenantPage() {
  return <ViewTenantsList basePath="/superadmin" portal="superadmin" />;
}
