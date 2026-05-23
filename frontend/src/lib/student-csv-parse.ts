import { getTemplateForTenantType, type StudentCsvField } from '@/lib/student-csv-templates';
import type { CsvRowPayload } from '@/lib/members-api';

export type StudentValidatedRow = CsvRowPayload & {
  status: 'VALID' | 'INVALID';
  errors: string[];
  warnings: string[];
  rowNumber: number;
};

const ID_KEYS = [
  'registration_or_user_id',
  'employee_id',
  'learner_id',
  'learner_external_id',
  'government_employee_code',
];

const DEPARTMENT_KEYS = ['department_branch_specialization', 'department', 'business_unit'];

function normalize(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ').trim();
  return String(value ?? '').trim();
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || normalize(value) === '';
}

function firstField(fields: StudentCsvField[], type: StudentCsvField['type']) {
  return fields.find((f) => f.type === type);
}

function pickRowValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const v = normalize(row[key]);
    if (v) return v;
  }
  return '';
}

export function validateStudentCsvRow(
  row: Record<string, unknown>,
  rowNumber: number,
  fields: StudentCsvField[],
): StudentValidatedRow {
  const errors: string[] = [];
  const extra: Record<string, string> = {};
  const reserved = new Set([
    'full_name',
    ...ID_KEYS,
    ...DEPARTMENT_KEYS,
    firstField(fields, 'email')?.key,
    firstField(fields, 'mobile')?.key,
  ]);

  fields.forEach((field) => {
    const value = row[field.key];
    if (field.required && isEmpty(value)) {
      errors.push(`${field.label} is required`);
    }
    if (!isEmpty(value) && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(value))) {
      errors.push(`${field.label} must be a valid email`);
    }
    if (!isEmpty(value) && field.type === 'mobile') {
      const digits = normalize(value).replace(/\D/g, '').slice(-10);
      if (!/^[0-9]{10}$/.test(digits)) {
        errors.push(`${field.label} must be exactly 10 digits`);
      }
    }
    if (!isEmpty(value) && field.type === 'year' && !/^\d{4}(-\d{2,4})?$/.test(normalize(value))) {
      errors.push(`${field.label} must be a valid year (e.g. 2028 or 2024-2025)`);
    }
    if (!isEmpty(value) && !reserved.has(field.key)) {
      extra[field.key] = normalize(value);
    }
  });

  const emailField = firstField(fields, 'email');
  const mobileField = firstField(fields, 'mobile');
  const fullName = normalize(row.full_name);
  const email = emailField ? normalize(row[emailField.key]).toLowerCase() : '';
  const phone = mobileField
    ? normalize(row[mobileField.key]).replace(/\D/g, '').slice(-10)
    : '';
  const employeeId = pickRowValue(row, ID_KEYS);
  const department = pickRowValue(row, DEPARTMENT_KEYS);

  if (!fullName) errors.push('Full name is required');
  if (emailField?.required && !email) errors.push('Email is required');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email is invalid');
  if (mobileField?.required && (!phone || phone.length !== 10)) {
    errors.push('Mobile must be 10 digits');
  }

  return {
    rowIndex: rowNumber,
    rowNumber,
    fullName,
    email,
    phone,
    employeeId: employeeId || undefined,
    department: department || undefined,
    extra,
    status: errors.length === 0 ? 'VALID' : 'INVALID',
    errors,
    warnings: [],
  };
}

export function parseStudentCsvRows(
  data: Record<string, unknown>[],
  tenantType: string,
): StudentValidatedRow[] {
  const fields = getTemplateForTenantType(tenantType);
  return data.map((row, index) => validateStudentCsvRow(row, index + 2, fields));
}

export function studentRowsToPayload(rows: StudentValidatedRow[]): CsvRowPayload[] {
  return rows.map((r) => ({
    rowIndex: r.rowIndex,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone,
    department: r.department,
    employeeId: r.employeeId,
    extra: r.extra,
  }));
}
