'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadTenantConfigurationDraft, saveTenantConfigurationDraft } from '@/lib/tenants-api';
import { TenantFlowBreadcrumbs } from '@/tenant/components/TenantFlowBreadcrumbs';
import neoToast from '@/lib/toast';
import '@/tenant/styles/tenant-configuration.css';

type Props = {
  basePath: '/superadmin' | '/platform-admin';
};

export function TenantConfigurationForm({ basePath }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tenantType: '',
    tenantId: '',
    tenantName: '',
  });
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const draft = loadTenantConfigurationDraft();
    if (draft) {
      setFormData({
        tenantId: draft.tenantId || '',
        tenantName: draft.tenantName || '',
        tenantType: draft.tenantType || '',
      });
      setHasDraft(Boolean(draft.tenantId && draft.tenantName && draft.tenantType));
    }
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    if (name === 'tenantId') return;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleStartConfiguration() {
    if (!formData.tenantType || !formData.tenantId || !formData.tenantName) {
      neoToast.error('Please complete tenant registration first.');
      router.push(`${basePath}/tenant/add`);
      return;
    }

    saveTenantConfigurationDraft(formData);
    router.push(`${basePath}/tenant/modules`);
  }

  return (
    <main className="configPage">
      <TenantFlowBreadcrumbs
        basePath={basePath}
        current="configuration"
        allowForwardSteps={hasDraft}
      />

      <section className="configCard">
        <h1 className="configTitle">Tenant Configuration</h1>

        <div className="configGrid">
          <div className="configField">
            <label>Tenant Type</label>
            <select
              name="tenantType"
              value={formData.tenantType}
              onChange={handleChange}
              disabled={Boolean(formData.tenantId)}
            >
              <option value="">Select Tenant Type</option>
              <option value="UNIVERSITY">UNIVERSITY</option>
              <option value="COLLEGE">COLLEGE</option>
              <option value="CORPORATE">CORPORATE</option>
              <option value="SKILL_ACADEMY">SKILL_ACADEMY</option>
              <option value="BOOTCAMP">BOOTCAMP</option>
              <option value="SCHOOL">SCHOOL</option>
              <option value="NGO">NGO</option>
              <option value="GOVERNMENT">GOVERNMENT</option>
            </select>
          </div>

          {formData.tenantType ? (
            <div className="configField">
              <label>Tenant ID</label>
              <input name="tenantId" value={formData.tenantId} readOnly disabled />
            </div>
          ) : null}

          <div className="configField">
            <label>Tenant Name</label>
            <input
              name="tenantName"
              value={formData.tenantName}
              onChange={handleChange}
              placeholder="ABC University"
            />
          </div>
        </div>

        <div className="configActions">
          <button type="button" className="configButton" onClick={handleStartConfiguration}>
            Start Configuration
          </button>
        </div>
      </section>
    </main>
  );
}
