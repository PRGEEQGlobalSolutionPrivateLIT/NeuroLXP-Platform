'use client';

import { ModulesDashboardForm } from '@/tenant/components/ModulesDashboardForm';

export function SuperAdminTenantModulesPage() {
  return <ModulesDashboardForm basePath="/superadmin" portal="superadmin" />;
}
