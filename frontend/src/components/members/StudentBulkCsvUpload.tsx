'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { getTemplateForTenantType } from '@/lib/student-csv-templates';
import { parseStudentCsvRows, studentRowsToPayload, type StudentValidatedRow } from '@/lib/student-csv-parse';
import { membersApi } from '@/lib/members-api';
import { saveBulkCredentials } from '@/lib/bulk-credentials-cache';
import {
  buildBulkCredentialsCache,
  formatBulkInviteToast,
  parseBulkInviteResponse,
} from '@/lib/bulk-invite-response';
import neoToast from '@/lib/toast';
import './student-bulk-upload.css';

type TenantOption = { id: string; tenantId: string; tenantName: string; tenantType: string };

type Props = {
  createdByType: 'platform_admin' | 'super_admin' | 'institution_admin';
  createdById?: string;
  onComplete: (bulkUploadId: string) => void;
  onBack: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function StudentBulkCsvUpload({ createdByType, createdById, onComplete, onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<StudentValidatedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === tenantId),
    [tenants, tenantId],
  );

  const selectedTemplate = useMemo(
    () => (selectedTenant ? getTemplateForTenantType(selectedTenant.tenantType) : []),
    [selectedTenant],
  );

  const validRows = rows.filter((r) => r.status === 'VALID');
  const invalidRows = rows.filter((r) => r.status === 'INVALID');
  const validPreviewRows = validRows;
  const invalidPreviewRows = invalidRows;

  useEffect(() => {
    fetch(`${API_BASE}/api/tenants`)
      .then((r) => r.json())
      .then((data: TenantOption[]) => {
        setTenants([...data].sort((a, b) => a.tenantName.localeCompare(b.tenantName)));
      })
      .catch(() => neoToast.error('Could not load tenants'))
      .finally(() => setTenantLoading(false));
  }, []);

  function resetUploadState() {
    setFileName('');
    setRows([]);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleTenantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTenantId(e.target.value);
    resetUploadState();
  }

  function requireTenant(): TenantOption | null {
    if (!selectedTenant) {
      neoToast.error('Please choose a tenant to continue');
      return null;
    }
    return selectedTenant;
  }

  function handleDownloadTemplate() {
    const tenant = requireTenant();
    if (!tenant || !selectedTemplate.length) return;

    const headers = selectedTemplate.map((f) => f.key);
    const csv = Papa.unparse([headers]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.tenantType.toLowerCase()}_bulk_upload_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const tenant = requireTenant();
    if (!tenant) {
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      resetUploadState();
      return;
    }

    setFileName(file.name);
    setShowPreview(false);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const validated = parseStudentCsvRows(
          result.data as Record<string, unknown>[],
          tenant.tenantType,
        );
        setRows(validated);
        if (!validated.length) neoToast.error('CSV is empty or invalid');
        else neoToast.success(`Parsed ${validated.length} rows`);
      },
      error: () => neoToast.error('CSV parsing failed'),
    });
    e.target.value = '';
  }

  function handlePreview() {
    if (!requireTenant()) return;
    if (!fileName || !rows.length) {
      neoToast.error('Please select a valid CSV file first');
      return;
    }
    setShowPreview(true);
  }

  function downloadErrorRowsCsv() {
    if (!requireTenant() || !rows.length) return;
    if (!invalidRows.length) {
      neoToast.info('There are no invalid rows to download');
      return;
    }

    const csvRows = invalidRows.map((row) => {
      const cleanRow: Record<string, string | number> = { csv_row_number: row.rowNumber };
      selectedTemplate.forEach((field) => {
        const v = getCellValue(row, field.key);
        cleanRow[field.key] = v === '-' ? '' : v;
      });
      cleanRow.validation_errors = row.errors.join(' | ');
      return cleanRow;
    });

    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_error_rows.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function getCellValue(row: StudentValidatedRow, key: string) {
    if (key === 'full_name') return row.fullName || '-';
    if (key === 'email' || key === 'corporate_email' || key === 'official_email') return row.email || '-';
    if (key === 'mobile' || key === 'mobile_number') return row.phone || '-';
    return row.extra[key] || '-';
  }

  function renderPreviewTable(title: string, tableRows: StudentValidatedRow[]) {
    if (!showPreview || !tableRows.length) return null;

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
                <tr key={row.rowNumber} className="previewRow">
                  <td>{row.rowNumber}</td>
                  {selectedTemplate.map((field) => (
                    <td key={field.key}>{getCellValue(row, field.key)}</td>
                  ))}
                  <td>
                    <span
                      className={`statusBadge ${
                        row.status === 'VALID' ? 'statusValid' : 'statusInvalid'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="errorCell">{row.errors.length ? row.errors.join(', ') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  async function handleImport() {
    const tenant = requireTenant();
    if (!tenant || !validRows.length) {
      neoToast.error('No valid rows available to import');
      return;
    }

    setIsImporting(true);
    try {
      const { data } = await membersApi.inviteBulk({
        role: 'student',
        rows: studentRowsToPayload(validRows),
        createdByType,
        createdById,
        fileName,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
      });

      const parsed = parseBulkInviteResponse(data);
      const bulkUploadId = parsed.bulkUploadId;

      if (!bulkUploadId) {
        neoToast.error('Import response missing upload id. Restart the backend and try again.');
        return;
      }

      const nameByEmail = new Map(validRows.map((r) => [r.email.toLowerCase(), r.fullName]));
      parsed.credentials.forEach((c) => {
        const name = nameByEmail.get(c.email.toLowerCase());
        if (name) c.fullName = name;
      });

      const cached = buildBulkCredentialsCache(bulkUploadId, parsed, {
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        fileName: fileName || null,
      });
      saveBulkCredentials(bulkUploadId, cached);

      if (parsed.succeeded === 0) {
        neoToast.error(formatBulkInviteToast(parsed));
      } else if (parsed.failed > 0) {
        neoToast.success(formatBulkInviteToast(parsed));
      } else {
        neoToast.success(formatBulkInviteToast(parsed));
      }
      window.dispatchEvent(new CustomEvent('member-bulk-upload-complete'));
      window.dispatchEvent(new CustomEvent('pa-approvals-refresh'));
      window.dispatchEvent(new CustomEvent('sa-approvals-refresh'));
      onComplete(bulkUploadId);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="student-bulk-upload-root">
      <div className="backRow">
        <button type="button" className="neoButton" onClick={onBack}>
          ← Back
        </button>
      </div>

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
              value={tenantId}
              onChange={handleTenantChange}
              className="uploadInput"
              disabled={tenantLoading}
            >
              <option value="">
                {tenantLoading ? 'Loading tenants...' : 'Choose tenant'}
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tenantName} ({t.tenantType}) - {t.tenantId}
                </option>
              ))}
            </select>
            {selectedTenant && (
              <p className="pageText">
                Selected tenant:{' '}
                <span className="smallText">
                  <strong>
                    {selectedTenant.tenantName} / {selectedTenant.tenantType} / {selectedTenant.tenantId}
                  </strong>
                </span>
              </p>
            )}
          </div>
        </section>

        <section className={`neoCard uploadSection ${!selectedTenant ? 'disabledSection' : ''}`}>
          <h3 className="subTitle">Upload CSV File</h3>
          <div className="neoInset uploadBox">
            <label className="uploadLabel">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hiddenFileInput"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="uploadInput chooseFileButton"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedTenant}
            >
              Choose File
            </button>
            {!selectedTenant && <p className="pageText">Choose a tenant first to continue.</p>}
            {selectedTenant && (
              <p className="pageText">
                Template type: <strong>{selectedTenant.tenantType}</strong>
              </p>
            )}
            {fileName && (
              <p className="pageText">
                Selected file: <strong>{fileName}</strong>
              </p>
            )}
          </div>

          <div className="buttonGroup">
            <button
              type="button"
              className="neoButton"
              onClick={handleDownloadTemplate}
              disabled={!selectedTenant}
            >
              Download Template
            </button>
            <button
              type="button"
              className="neoButton"
              onClick={handlePreview}
              disabled={!selectedTenant || !rows.length}
            >
              Upload / Preview
            </button>
            <button
              type="button"
              className="neoButton redButton"
              onClick={downloadErrorRowsCsv}
              disabled={!selectedTenant}
            >
              Download Error Rows CSV
            </button>
            <button
              type="button"
              className="neoButton greenButton"
              onClick={handleImport}
              disabled={!selectedTenant || validRows.length === 0 || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Valid Rows'}
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
              <p className="summaryNumber greenText">{validRows.length}</p>
            </div>
            <div className="neoCard summaryCard">
              <h4 className="cardTitle">Invalid Rows</h4>
              <p className="summaryNumber redText">{invalidRows.length}</p>
            </div>
          </section>
        )}

        {renderPreviewTable('Correct / Valid Rows', validPreviewRows)}
        {renderPreviewTable('Incorrect / Error Rows', invalidPreviewRows)}
      </main>
    </div>
  );
}
