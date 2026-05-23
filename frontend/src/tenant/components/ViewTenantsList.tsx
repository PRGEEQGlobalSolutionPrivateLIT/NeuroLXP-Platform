'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { createTenantsApi, type TenantPortal, type TenantRecord } from '@/lib/tenants-api';
import { TenantFlowBreadcrumbs } from '@/tenant/components/TenantFlowBreadcrumbs';
import neoToast from '@/lib/toast';

type Props = {
  basePath: '/superadmin' | '/platform-admin';
  portal: TenantPortal;
};

export function ViewTenantsList({ basePath, portal }: Props) {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    createTenantsApi(portal)
      .listTenants()
      .then(({ data }) => {
        if (!cancelled) setTenants(data);
      })
      .catch(() => {
        if (!cancelled) neoToast.error('Failed to load tenants.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portal]);

  return (
    <div className="space-y-6">
      <TenantFlowBreadcrumbs basePath={basePath} current="view" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--neo-muted)]">Dashboard / Tenant / View tenant</p>
          <h1 className="text-2xl font-bold text-[var(--neo-text)]">View tenants</h1>
          <p className="mt-1 text-sm text-[var(--neo-muted)]">
            All registered tenants and their module configuration status.
          </p>
        </div>
        <Link href={`${basePath}/tenant/add`}>
          <NeumorphicButton variant="primary">Add tenant</NeumorphicButton>
        </Link>
      </div>

      <div className="neo-card overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-sm text-[var(--neo-muted)]">Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <p className="p-6 text-sm text-[var(--neo-muted)]">No tenants registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--neo-border)] bg-[var(--neo-surface)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tenant ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Modules</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-[var(--neo-border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{tenant.tenantId}</td>
                    <td className="px-4 py-3">{tenant.tenantName}</td>
                    <td className="px-4 py-3">{tenant.tenantType}</td>
                    <td className="px-4 py-3 text-[var(--neo-muted)]">
                      {[tenant.city, tenant.state, tenant.country].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-4 py-3">{tenant.status}</td>
                    <td className="px-4 py-3 text-[var(--neo-muted)]">
                      {tenant.moduleConfiguration
                        ? `${tenant.moduleConfiguration.selectedModules.length} modules`
                        : 'Not configured'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link href={`${basePath}/tenant`}>
        <NeumorphicButton>Back to Tenant</NeumorphicButton>
      </Link>
    </div>
  );
}
