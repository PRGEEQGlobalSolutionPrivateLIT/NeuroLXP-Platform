'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTenantsApi,
  loadTenantConfigurationDraft,
  type TenantPortal,
} from '@/lib/tenants-api';
import { TenantFlowBreadcrumbs } from '@/tenant/components/TenantFlowBreadcrumbs';
import neoToast from '@/lib/toast';
import '@/tenant/styles/modules-dashboard.css';

const tenantTypes = [
  'University',
  'College',
  'Corporate',
  'Skill Academy',
  'NGO',
  'Government',
  'Bootcamp',
  'School',
];

const mainModules = [
  'Assessment',
  'Progress Tracking',
  'Training',
  'Attendance Tracker',
  'Report and Analytics',
  'Communication',
];

type Props = {
  basePath: '/superadmin' | '/platform-admin';
  portal: TenantPortal;
};

export function ModulesDashboardForm({ basePath, portal }: Props) {
  const router = useRouter();
  const tenantsApi = createTenantsApi(portal);

  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantType, setTenantType] = useState('');
  const [profilingTenantTypes, setProfilingTenantTypes] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = loadTenantConfigurationDraft();
    if (!draft) return;
    setTenantId(draft.tenantId || '');
    setTenantName(draft.tenantName || '');
    setTenantType(draft.tenantType || '');
  }, []);

  function toggleProfilingTenantType(type: string) {
    setProfilingTenantTypes((previous) =>
      previous.includes(type) ? previous.filter((item) => item !== type) : [...previous, type],
    );
  }

  function toggleModule(moduleName: string) {
    setSelectedModules((previous) =>
      previous.includes(moduleName)
        ? previous.filter((item) => item !== moduleName)
        : [...previous, moduleName],
    );
  }

  const summaryItems = useMemo(() => {
    const profilingItems = profilingTenantTypes.map((type) => `Profiling - ${type}`);
    return [...profilingItems, ...selectedModules];
  }, [profilingTenantTypes, selectedModules]);

  async function handleSaveConfiguration() {
    if (!tenantId || !tenantName || !tenantType) {
      neoToast.error('Tenant details are missing. Complete registration first.');
      router.push(`${basePath}/tenant/add`);
      return;
    }

    try {
      setSaving(true);
      await tenantsApi.saveConfiguration(tenantId, {
        tenantName,
        tenantType,
        profilingTenantTypes,
        selectedModules,
      });
      neoToast.success('Tenant module configuration saved.');
      router.push(`${basePath}/tenant/view`);
    } catch {
      neoToast.error('Failed to save module configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="modulesPage">
      <TenantFlowBreadcrumbs basePath={basePath} current="modules" allowForwardSteps />

      <section className="modulesCard">
        <h1 className="modulesTitle">Module Configuration</h1>

        <div className="tenantInfoGrid">
          <div className="modulesField">
            <label>Tenant ID</label>
            <input value={tenantId || '-'} readOnly />
          </div>

          <div className="modulesField">
            <label>Tenant Name</label>
            <input value={tenantName || '-'} readOnly />
          </div>

          <div className="modulesField">
            <label>Tenant Type</label>
            <input value={tenantType || '-'} readOnly />
          </div>
        </div>

        <section className="moduleList">
          <div className="moduleRow profilingRow">
            <div className="moduleNumber">1.</div>
            <div className="moduleContent">
              <h2>Profiling</h2>
              <div className="tenantTypeChecklist">
                {tenantTypes.map((type) => (
                  <label key={type} className="checkboxLine">
                    <span>{type}</span>
                    <input
                      type="checkbox"
                      checked={profilingTenantTypes.includes(type)}
                      onChange={() => toggleProfilingTenantType(type)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {mainModules.map((moduleName, index) => (
            <div key={moduleName} className="moduleRow">
              <div className="moduleNumber">{index + 2}.</div>
              <label className="singleModuleLine">
                <span>{moduleName}</span>
                <input
                  type="checkbox"
                  checked={selectedModules.includes(moduleName)}
                  onChange={() => toggleModule(moduleName)}
                />
              </label>
            </div>
          ))}
        </section>

        <section className="summaryBox">
          <h3>Summary</h3>
          <p>
            Selected modules for this tenant will control what appears in that tenant dashboard.
          </p>
          <div className="summaryMeta">
            <span>Tenant ID: {tenantId || '-'}</span>
            <span>Tenant Name: {tenantName || '-'}</span>
            <span>Tenant Type: {tenantType || '-'}</span>
          </div>
          {summaryItems.length === 0 ? (
            <p className="emptySummary">No modules selected.</p>
          ) : (
            <ul>
              {summaryItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="modulesActions">
          <button type="button" onClick={handleSaveConfiguration} disabled={saving}>
            {saving ? 'Saving...' : 'Save and Configure'}
          </button>
        </div>
      </section>
    </main>
  );
}
