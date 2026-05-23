/** Editable student profile fields (not from CSV bulk upload) */

export type StudentProfileSupplement = {
  feature_goal: string;
  attended_hackathon: 'yes' | 'no';
  hackathon_title: string;
  hackathon_team_size: string;
  won_prize: 'yes' | 'no';
  prize_place: '' | '1st' | '2nd' | '3rd';
  cash_prize: string;
  project_title: string;
};

export const EMPTY_STUDENT_SUPPLEMENT: StudentProfileSupplement = {
  feature_goal: '',
  attended_hackathon: 'no',
  hackathon_title: '',
  hackathon_team_size: '',
  won_prize: 'no',
  prize_place: '',
  cash_prize: '',
  project_title: '',
};

export function normalizeStudentSupplement(raw: unknown): StudentProfileSupplement {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, string>;
  const attended = o.attended_hackathon === 'yes' ? 'yes' : 'no';
  const won = o.won_prize === 'yes' ? 'yes' : 'no';
  const place = o.prize_place === '1st' || o.prize_place === '2nd' || o.prize_place === '3rd' ? o.prize_place : '';
  const cash = String(o.cash_prize ?? '').replace(/\D/g, '');

  return {
    feature_goal: String(o.feature_goal ?? '').trim(),
    attended_hackathon: attended,
    hackathon_title: attended === 'yes' ? String(o.hackathon_title ?? '').trim() : '',
    hackathon_team_size: attended === 'yes' ? String(o.hackathon_team_size ?? '').trim() : '',
    won_prize: attended === 'yes' ? won : 'no',
    prize_place: attended === 'yes' && won === 'yes' ? place : '',
    cash_prize: attended === 'yes' && won === 'yes' ? cash : '',
    project_title: String(o.project_title ?? '').trim(),
  };
}

/** Labels for CSV-backed profile keys */
export const CSV_PROFILE_LABELS: Record<string, string> = {
  registration_or_user_id: 'Registration / User ID',
  full_name: 'Full Name',
  email: 'Email',
  mobile: 'Mobile',
  gender: 'Gender',
  date_of_birth: 'Date of Birth',
  academic_year: 'Academic Year',
  expected_passout_year: 'Expected Passout Year',
  onboarding_date: 'Onboarding Date',
  department_branch_specialization: 'Department / Branch / Specialization',
  current_year_of_study: 'Current Year of Study',
  tenant_id: 'Tenant ID',
  tenant_name: 'Tenant Name',
};

export function csvFieldLabel(key: string): string {
  return CSV_PROFILE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
