'use client';

import { useRouter } from 'next/navigation';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

export function PlatformAdminTenantPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--neo-muted)]">Dashboard / Tenant</p>
        <h1 className="text-2xl font-bold text-[var(--neo-text)]">Tenant</h1>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">
          Create and manage platform tenants.
        </p>
      </div>

      <div className="neo-card p-6">
        <h2 className="text-lg font-bold text-[var(--neo-text)]">Tenant management</h2>
        <p className="mt-1 text-sm text-[var(--neo-muted)]">Add new tenants or view existing ones</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <NeumorphicButton variant="primary" onClick={() => router.push('/platform-admin/tenant/add')}>
            Add tenant
          </NeumorphicButton>
          <NeumorphicButton onClick={() => router.push('/platform-admin/tenant/view')}>
            View tenant
          </NeumorphicButton>
        </div>
      </div>
    </div>
  );
}
