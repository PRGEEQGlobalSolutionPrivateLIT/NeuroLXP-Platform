'use client';

import Link from 'next/link';
import '@/tenant/styles/tenant-breadcrumbs.css';

export type TenantFlowStep = 'hub' | 'register' | 'configuration' | 'modules' | 'view';

type Props = {
  basePath: '/superadmin' | '/platform-admin';
  current: TenantFlowStep;
  /** Allow navigating to configuration/modules only when draft exists */
  allowForwardSteps?: boolean;
};

const FLOW_STEPS: { key: TenantFlowStep; label: string; path: string }[] = [
  { key: 'register', label: 'Register tenant', path: '/tenant/add' },
  { key: 'configuration', label: 'Configuration', path: '/tenant/configuration' },
  { key: 'modules', label: 'Modules', path: '/tenant/modules' },
];

export function TenantFlowBreadcrumbs({
  basePath,
  current,
  allowForwardSteps = false,
}: Props) {
  const currentIndex = FLOW_STEPS.findIndex((s) => s.key === current);

  function canNavigateTo(step: (typeof FLOW_STEPS)[number], index: number) {
    if (step.key === current) return false;
    if (index < currentIndex) return true;
    return allowForwardSteps;
  }

  return (
    <nav className="tenantBreadcrumbs" aria-label="Tenant registration breadcrumb">
      <ol className="tenantBreadcrumbsList">
        <li className={`tenantBreadcrumbsItem ${current === 'hub' ? 'isCurrent' : ''}`}>
          {current === 'hub' ? (
            <span>Tenant</span>
          ) : (
            <Link href={`${basePath}/tenant`}>Tenant</Link>
          )}
        </li>

        {current === 'view' ? (
          <>
            <li className="tenantBreadcrumbsSep" aria-hidden>
              /
            </li>
            <li className="tenantBreadcrumbsItem isCurrent">
              <span>View tenants</span>
            </li>
          </>
        ) : (
          FLOW_STEPS.map((step, index) => {
            const clickable = canNavigateTo(step, index);
            return (
              <li
                key={step.key}
                className={`tenantBreadcrumbsItem ${step.key === current ? 'isCurrent' : ''}`}
              >
                <span className="tenantBreadcrumbsSep" aria-hidden>
                  /
                </span>
                {clickable ? (
                  <Link href={`${basePath}${step.path}`}>{step.label}</Link>
                ) : (
                  <span>{step.label}</span>
                )}
              </li>
            );
          })
        )}
      </ol>

      {current !== 'hub' && current !== 'view' && (
        <div className="tenantBreadcrumbsBack">
          <Link href={current === 'register' ? `${basePath}/tenant` : getBackHref(basePath, current)}>
            ← Back
          </Link>
        </div>
      )}

      {current === 'view' && (
        <div className="tenantBreadcrumbsBack">
          <Link href={`${basePath}/tenant`}>← Back to Tenant</Link>
        </div>
      )}
    </nav>
  );
}

function getBackHref(
  basePath: '/superadmin' | '/platform-admin',
  current: TenantFlowStep,
): string {
  if (current === 'configuration') return `${basePath}/tenant/add`;
  if (current === 'modules') return `${basePath}/tenant/configuration`;
  return `${basePath}/tenant`;
}
