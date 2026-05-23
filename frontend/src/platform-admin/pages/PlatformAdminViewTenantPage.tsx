'use client';

import { ViewTenantsList } from '@/tenant/components/ViewTenantsList';

export function PlatformAdminViewTenantPage() {
  return <ViewTenantsList basePath="/platform-admin" portal="platform-admin" />;
}
