"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "./tenant-configuration.css";

export default function TenantConfigurationPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    tenantType: "",
    tenantId: "",
    tenantName: "",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleStartConfiguration() {
    if (
      !formData.tenantType ||
      !formData.tenantId ||
      !formData.tenantName
    ) {
      alert("Please fill all fields.");
      return;
    }

    localStorage.setItem(
      "tenant_configuration",
      JSON.stringify(formData)
    );

    router.push("/modules-dashboard");
  }

  return (
    <main className="configPage">
      <section className="configCard">
        <h1 className="configTitle">Tenant Configuration</h1>

        <div className="configGrid">
          <div className="configField">
            <label>Tenant Type</label>

            <select
              name="tenantType"
              value={formData.tenantType}
              onChange={handleChange}
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

          <div className="configField">
            <label>Tenant ID</label>

            <input
              name="tenantId"
              value={formData.tenantId}
              onChange={handleChange}
              placeholder="TEN-001"
            />
          </div>

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
          <button
            type="button"
            className="configButton"
            onClick={handleStartConfiguration}
          >
            Start Configuration
          </button>
        </div>
      </section>
    </main>
  );
}