"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import "./bulk-upload.css";

type Tenant = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantType: string;
};

type CsvRow = Record<string, string | number | string[] | undefined>;

type CsvField = {
  key: string;
  label: string;
  required: boolean;
  type?: "text" | "email" | "mobile" | "year" | "date";
};

type ValidatedRow = CsvRow & {
  rowNumber: number;
  status: "VALID" | "INVALID";
  errors: string[];
};

const csvTemplates: Record<string, CsvField[]> = {
  UNIVERSITY: [
    { key: "registration_or_user_id", label: "Registration/User ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true, type: "email" },
    { key: "mobile", label: "Mobile", required: true, type: "mobile" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "academic_year", label: "Academic Year", required: true },
    { key: "expected_passout_year", label: "Expected Passout Year", required: true, type: "year" },
    { key: "onboarding_date", label: "Onboarding Date", required: true, type: "date" },
    { key: "department_branch_specialization", label: "Department/Branch/Specialization", required: true },
    { key: "current_year_of_study", label: "Current Year of Study", required: true },
  ],
  COLLEGE: [
    { key: "registration_or_user_id", label: "Registration/User ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true, type: "email" },
    { key: "mobile", label: "Mobile", required: true, type: "mobile" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "academic_year", label: "Academic Year", required: true },
    { key: "expected_passout_year", label: "Expected Passout Year", required: true, type: "year" },
    { key: "onboarding_date", label: "Onboarding Date", required: true, type: "date" },
    { key: "department_branch_specialization", label: "Department/Branch/Specialization", required: true },
    { key: "current_year_of_study", label: "Current Year of Study", required: true },
  ],
  CORPORATE: [
    { key: "employee_id", label: "Employee ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "corporate_email", label: "Corporate Email", required: true, type: "email" },
    { key: "mobile_number", label: "Mobile Number", required: true, type: "mobile" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "business_unit", label: "Business Unit", required: true },
    { key: "department", label: "Department", required: true },
    { key: "team", label: "Team", required: false },
    { key: "designation", label: "Designation", required: true },
    { key: "reporting_manager", label: "Reporting Manager", required: false },
    { key: "office_location", label: "Office Location", required: false },
    { key: "employment_type", label: "Employment Type", required: true },
    { key: "employment_status", label: "Employment Status", required: true },
    { key: "employee_grade", label: "Employee Grade", required: false },
    { key: "date_of_joining", label: "Date of Joining", required: true, type: "date" },
    { key: "current_role", label: "Current Role", required: true },
    { key: "assigned_learning_path", label: "Assigned Learning Path", required: false },
  ],
  SKILL_ACADEMY: [
    { key: "learner_id", label: "Learner ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true, type: "email" },
    { key: "mobile_number", label: "Mobile Number", required: true, type: "mobile" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "skill_domain", label: "Skill Domain", required: true },
    { key: "program", label: "Program", required: true },
    { key: "specialization", label: "Specialization", required: false },
    { key: "training_cohort", label: "Training Cohort", required: true },
    { key: "batch", label: "Batch", required: true },
    { key: "practical_lab_group", label: "Practical/Lab Group", required: false },
    { key: "enrollment_date", label: "Enrollment Date", required: true, type: "date" },
    { key: "expected_completion_date", label: "Expected Completion Date", required: true, type: "date" },
    { key: "learner_status", label: "Learner Status", required: true },
    { key: "highest_qualification", label: "Highest Qualification", required: false },
    { key: "technical_skills", label: "Technical Skills", required: false },
    { key: "skill_proficiency_level", label: "Skill Proficiency Level", required: false },
  ],
  BOOTCAMP: [
    { key: "learner_id", label: "Learner ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true, type: "email" },
    { key: "mobile_number", label: "Mobile Number", required: true, type: "mobile" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "domain", label: "Domain", required: true },
    { key: "program", label: "Program", required: true },
    { key: "specialization", label: "Specialization", required: false },
    { key: "cohort", label: "Cohort", required: true },
    { key: "batch", label: "Batch", required: true },
    { key: "enrollment_date", label: "Enrollment Date", required: true, type: "date" },
    { key: "expected_completion_date", label: "Expected Completion Date", required: true, type: "date" },
    { key: "learner_status", label: "Learner Status", required: true },
    { key: "highest_qualification", label: "Highest Qualification", required: false },
    { key: "skill_names", label: "Skill Names", required: false },
    { key: "skill_categories", label: "Skill Categories", required: false },
    { key: "skill_proficiency", label: "Skill Proficiency", required: false },
  ],
  NGO: [
    { key: "learner_external_id", label: "Learner External ID", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "mobile_number", label: "Mobile Number", required: true, type: "mobile" },
    { key: "email", label: "Email", required: false, type: "email" },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "state", label: "State", required: true },
    { key: "district", label: "District", required: true },
    { key: "centre_name", label: "Centre Name", required: true },
    { key: "project_name", label: "Project Name", required: true },
    { key: "programme_name", label: "Programme Name", required: true },
    { key: "batch_name", label: "Batch Name", required: true },
    { key: "highest_education", label: "Highest Education", required: false },
    { key: "employment_status", label: "Employment Status", required: false },
    { key: "family_income_band", label: "Family Income Band", required: false },
    { key: "village_town", label: "Village/Town", required: false },
    { key: "preferred_language", label: "Preferred Language", required: false },
    { key: "internet_access", label: "Internet Access", required: false },
    { key: "device_access", label: "Device Access", required: false },
  ],
  GOVERNMENT: [
    { key: "employee_id", label: "Employee ID", required: true },
    { key: "government_employee_code", label: "Government Employee Code", required: true },
    { key: "full_name", label: "Full Name", required: true },
    { key: "gender", label: "Gender", required: true },
    { key: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
    { key: "official_email", label: "Official Email", required: true, type: "email" },
    { key: "department", label: "Department", required: true },
    { key: "designation", label: "Designation", required: true },
    { key: "cadre", label: "Cadre", required: false },
    { key: "joining_date", label: "Joining Date", required: true, type: "date" },
    { key: "district", label: "District", required: true },
    { key: "state", label: "State", required: true },
  ],
};

export default function BulkUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch("http://localhost:3001/tenants");

        if (!response.ok) {
          alert("Unable to fetch tenants.");
          return;
        }

        const data: Tenant[] = await response.json();

        setTenants(
          [...data].sort((a, b) => a.tenantName.localeCompare(b.tenantName))
        );
      } catch {
        alert("Backend is not reachable. Start backend on port 3001.");
      } finally {
        setTenantLoading(false);
      }
    }

    fetchTenants();
  }, []);

  const selectedTenant = tenants.find(
    (tenant) => tenant.id === selectedTenantId
  );

  const selectedTemplate = useMemo(() => {
    if (!selectedTenant) {
      return [];
    }

    return csvTemplates[selectedTenant.tenantType] || [];
  }, [selectedTenant]);

  const validRows = rows.filter((row) => row.status === "VALID").length;
  const invalidRows = rows.filter((row) => row.status === "INVALID").length;

  const validPreviewRows = rows.filter((row) => row.status === "VALID");
  const invalidPreviewRows = rows.filter((row) => row.status === "INVALID");

  function normalize(value?: string | number | string[]) {
    if (Array.isArray(value)) {
      return value.join(", ").trim();
    }

    return String(value || "").trim();
  }

  function isEmpty(value: unknown) {
    return value === undefined || value === null || String(value).trim() === "";
  }

  function validateRow(row: CsvRow, index: number): ValidatedRow {
    const errors: string[] = [];

    selectedTemplate.forEach((field) => {
      const value = row[field.key];

      if (field.required && isEmpty(value)) {
        errors.push(`${field.key} is required`);
      }

      if (!isEmpty(value) && field.type === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(value))) {
          errors.push(`${field.key} must be a valid email`);
        }
      }

      if (!isEmpty(value) && field.type === "mobile") {
        if (!/^[0-9]{10}$/.test(normalize(value))) {
          errors.push(`${field.key} must be exactly 10 digits`);
        }
      }

      if (!isEmpty(value) && field.type === "year") {
        if (!/^\d{4}$/.test(normalize(value))) {
          errors.push(`${field.key} must be a valid 4 digit year`);
        }
      }
    });

    return {
      ...row,
      rowNumber: index + 2,
      status: errors.length > 0 ? "INVALID" : "VALID",
      errors,
    };
  }

  function resetUploadState() {
    setSelectedFileName("");
    setRows([]);
    setShowPreview(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleTenantChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedTenantId(event.target.value);
    resetUploadState();
  }

  function requireTenant(): Tenant | null {
    if (!selectedTenant) {
      alert("Please choose the tenant to continue.");
      return null;
    }

    return selectedTenant;
  }

  function handleChooseFileClick() {
    const tenant = requireTenant();

    if (!tenant) {
      return;
    }

    fileInputRef.current?.click();
  }

  function handleDownloadTemplate() {
    const tenant = requireTenant();

    if (!tenant) {
      return;
    }

    if (selectedTemplate.length === 0) {
      alert("No CSV template configured for this tenant type.");
      return;
    }

    const headers = selectedTemplate.map((field) => field.key);
    const csv = Papa.unparse([headers]);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${tenant.tenantType.toLowerCase()}_bulk_upload_template.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const tenant = requireTenant();

    if (!tenant) {
      event.target.value = "";
      resetUploadState();
      return;
    }

    const file = event.target.files?.[0];

    if (!file) {
      resetUploadState();
      return;
    }

    setSelectedFileName(file.name);
    setShowPreview(false);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        setRows(result.data.map((row, index) => validateRow(row, index)));
      },
      error: () => {
        alert("CSV parsing failed.");
      },
    });
  }

  function handlePreview() {
    const tenant = requireTenant();

    if (!tenant) {
      return;
    }

    if (!selectedFileName || rows.length === 0) {
      alert("Please select a valid CSV file first.");
      return;
    }

    setShowPreview(true);
  }

  async function handleImport() {
    const tenant = requireTenant();

    if (!tenant) {
      return;
    }

    const validRowsForImport = rows.filter((row) => row.status === "VALID");

    if (validRowsForImport.length === 0) {
      alert("No valid rows available to import.");
      return;
    }

    const payload = {
      tenant: {
        id: tenant.id,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        tenantType: tenant.tenantType,
      },
      validRows: validRowsForImport,
    };

    try {
      setIsImporting(true);

      const response = await fetch(
        "http://localhost:3001/profile-bulk-upload/import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        alert(errorData?.message || "Import failed.");
        return;
      }

      const result = await response.json();

      alert(
        `${result.importedCount} valid row(s) imported into ${result.targetTable}.`
      );
    } catch {
      alert("Backend is not reachable. Start backend on port 3001.");
    } finally {
      setIsImporting(false);
    }
  }

  function downloadErrorRowsCsv() {
    const tenant = requireTenant();

    if (!tenant) {
      return;
    }

    const errorRows = rows.filter((row) => row.status === "INVALID");

    if (rows.length === 0) {
      alert("Please upload and preview a CSV file first.");
      return;
    }

    if (errorRows.length === 0) {
      alert("There are no invalid rows to download.");
      return;
    }

    const csvRows = errorRows.map((row) => {
      const cleanRow: Record<string, string | number> = {
        csv_row_number: row.rowNumber,
      };

      selectedTemplate.forEach((field) => {
        const value = row[field.key];
        cleanRow[field.key] = Array.isArray(value)
          ? value.join(", ")
          : value || "";
      });

      cleanRow.validation_errors = row.errors.join(" | ");

      return cleanRow;
    });

    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bulk_upload_error_rows.csv";
    link.click();

    window.URL.revokeObjectURL(url);
  }

  function getCellValue(row: ValidatedRow, key: string) {
    const value = row[key];

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    return value || "-";
  }

  function renderPreviewTable(title: string, tableRows: ValidatedRow[]) {
    if (!showPreview || tableRows.length === 0) {
      return null;
    }

    return (
      <section className="tableWrapper neoCard">
        <div className="tableHeader">
          <h2 className="sectionTitle">{title}</h2>
        </div>

        <div className="tableScroll">
          <table className="previewTable">
            <thead>
              <tr>
                <th>CSV Row</th>

                {selectedTemplate.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}

                <th>Status</th>
                <th>Errors</th>
              </tr>
            </thead>

            <tbody>
              {tableRows.map((row) => (
                <tr key={`${row.rowNumber}`} className="previewRow">
                  <td>{row.rowNumber}</td>

                  {selectedTemplate.map((field) => (
                    <td key={field.key}>{getCellValue(row, field.key)}</td>
                  ))}

                  <td>
                    <span
                      className={`statusBadge ${
                        row.status === "VALID" ? "statusValid" : "statusInvalid"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>

                  <td className="errorCell">
                    {row.errors.length > 0 ? row.errors.join(", ") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <main className="bulkUploadPage">
      <section className="neoCard pageHeader">
        <h1 className="pageTitle">Tenant-wise Profile Bulk Upload</h1>
      </section>

      <section className="neoCard uploadSection">
        <h3 className="subTitle">Choose Tenant</h3>

        <div className="neoInset uploadBox">
          <label htmlFor="tenant-select" className="uploadLabel">
            Select Tenant
          </label>

          <select
            id="tenant-select"
            value={selectedTenantId}
            onChange={handleTenantChange}
            className="uploadInput"
            disabled={tenantLoading}
          >
            <option value="">
              {tenantLoading ? "Loading tenants..." : "Choose tenant"}
            </option>

            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.tenantName} ({tenant.tenantType}) - {tenant.tenantId}
              </option>
            ))}
          </select>

          {selectedTenant && (
            <p className="pageText">
              Selected tenant:{" "}
              <span className="smallText">
                <strong>
                  {selectedTenant.tenantName} / {selectedTenant.tenantType} /{" "}
                  {selectedTenant.tenantId}
                </strong>
              </span>
            </p>
          )}
        </div>
      </section>

      <section
        className={`neoCard uploadSection ${
          !selectedTenant ? "disabledSection" : ""
        }`}
      >
        <h3 className="subTitle">Upload CSV File</h3>

        <div className="neoInset uploadBox">
          <label className="uploadLabel">Select CSV File</label>

          <input
            ref={fileInputRef}
            id="bulk-upload-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hiddenFileInput"
            tabIndex={-1}
          />

          <button
            type="button"
            className="uploadInput chooseFileButton"
            onClick={handleChooseFileClick}
            disabled={!selectedTenant}
          >
            Choose File
          </button>

          {!selectedTenant && (
            <p className="pageText">Choose a tenant first to continue.</p>
          )}

          {selectedTenant && (
            <p className="pageText">
              Template type: <strong>{selectedTenant.tenantType}</strong>
            </p>
          )}

          {selectedFileName && (
            <p className="pageText">
              Selected file:{" "}
              <span className="smallText">
                <strong>{selectedFileName}</strong>
              </span>
            </p>
          )}
        </div>

        <div className="buttonGroup">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="neoButton"
            disabled={!selectedTenant}
          >
            Download Template
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="neoButton"
            disabled={!selectedTenant}
          >
            Upload / Preview
          </button>

          <button
            type="button"
            onClick={downloadErrorRowsCsv}
            className="neoButton redButton"
            disabled={!selectedTenant}
          >
            Download Error Rows CSV
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedTenant || validRows === 0 || isImporting}
            className="neoButton greenButton"
          >
            {isImporting ? "Importing..." : "Import Valid Rows"}
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <section className="summaryGrid">
          <div className="neoCard summaryCard">
            <h4 className="cardTitle">Total Rows</h4>
            <p className="summaryNumber">{rows.length}</p>
          </div>

          <div className="neoCard summaryCard">
            <h4 className="cardTitle">Valid Rows</h4>
            <p className="summaryNumber greenText">{validRows}</p>
          </div>

          <div className="neoCard summaryCard">
            <h4 className="cardTitle">Invalid Rows</h4>
            <p className="summaryNumber redText">{invalidRows}</p>
          </div>
        </section>
      )}

      {renderPreviewTable("Correct / Valid Rows", validPreviewRows)}
      {renderPreviewTable("Incorrect / Error Rows", invalidPreviewRows)}
    </main>
  );
}