export type ParsedCsvRow = {
  rowIndex: number;
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  employeeId?: string;
  extra: Record<string, string>;
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

const FULL_NAME_HEADERS = new Set([
  'name',
  'full name',
  'full_name',
  'fullname',
  'member name',
  'student name',
]);

const FIRST_NAME_HEADERS = new Set([
  'first name',
  'first_name',
  'firstname',
  'fname',
  'given name',
]);

const LAST_NAME_HEADERS = new Set([
  'last name',
  'last_name',
  'lastname',
  'lname',
  'surname',
  'family name',
]);

const EMAIL_HEADERS = new Set(['email', 'e-mail', 'mail', 'primary email']);

const PHONE_HEADERS = new Set([
  'phone',
  'phone number',
  'phone_number',
  'phonenumber',
  'mobile',
  'contact number',
  'contact',
]);

const DEPT_HEADERS = new Set(['department', 'dept', 'branch', 'division']);

const EMPLOYEE_ID_HEADERS = new Set([
  'employee_id',
  'employee id',
  'employeeid',
  'emp id',
  'id',
  'roll no',
  'roll number',
  'student id',
  'member id',
]);

type ColumnMap = {
  fullName?: number;
  firstName?: number;
  lastName?: number;
  email?: number;
  phone?: number;
  department?: number;
  employeeId?: number;
  extra: { idx: number; key: string }[];
};

function buildColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = { extra: [] };
  const allKnown = new Set([
    ...FULL_NAME_HEADERS,
    ...FIRST_NAME_HEADERS,
    ...LAST_NAME_HEADERS,
    ...EMAIL_HEADERS,
    ...PHONE_HEADERS,
    ...DEPT_HEADERS,
    ...EMPLOYEE_ID_HEADERS,
  ]);

  headers.forEach((raw, idx) => {
    const h = normalizeHeader(raw);
    if (FIRST_NAME_HEADERS.has(h)) map.firstName = idx;
    else if (LAST_NAME_HEADERS.has(h)) map.lastName = idx;
    else if (FULL_NAME_HEADERS.has(h)) map.fullName = idx;
    else if (EMAIL_HEADERS.has(h)) map.email = idx;
    else if (PHONE_HEADERS.has(h)) map.phone = idx;
    else if (DEPT_HEADERS.has(h)) map.department = idx;
    else if (EMPLOYEE_ID_HEADERS.has(h)) map.employeeId = idx;
    else if (!allKnown.has(h) && h) map.extra.push({ idx, key: h });
  });

  return map;
}

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if ((c === ',' && !inQuotes) || c === '\t') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function cell(cells: string[], idx?: number): string {
  if (idx === undefined) return '';
  return (cells[idx] ?? '').trim();
}

function buildFullName(cells: string[], map: ColumnMap): string {
  if (map.fullName !== undefined) return cell(cells, map.fullName);
  const first = cell(cells, map.firstName);
  const last = cell(cells, map.lastName);
  return [first, last].filter(Boolean).join(' ').trim();
}

export function parseMemberCsv(text: string): ParsedCsvRow[] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const colMap = buildColumnMap(headers);

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;

    const row: ParsedCsvRow = {
      rowIndex: i,
      fullName: buildFullName(cells, colMap),
      email: cell(cells, colMap.email),
      phone: cell(cells, colMap.phone),
      department: colMap.department !== undefined ? cell(cells, colMap.department) : undefined,
      employeeId: colMap.employeeId !== undefined ? cell(cells, colMap.employeeId) : undefined,
      extra: {},
    };

    colMap.extra.forEach(({ idx, key }) => {
      row.extra[key] = cell(cells, idx);
    });

    rows.push(row);
  }
  return rows;
}

export const MEMBER_CSV_TEMPLATE = `ID,first name,Last name,Email,Phone number,Branch
SIET01,Raju,kulkarni,raji.k@siet.org,6523987415,ISE`;

export const MEMBER_CSV_COLUMN_HELP = `Supported columns (any mix):
• Name: full_name OR first name + last name
• Email: email
• Phone: phone / Phone number
• Optional: department / Branch, employee_id / ID`;
