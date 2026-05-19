export const GOVT_ID_TYPES = [
  { value: 'Aadhaar', label: 'Aadhaar' },
  { value: 'PAN', label: 'PAN' },
  { value: 'Driving Licence', label: 'Driving Licence' },
  { value: 'Passport', label: 'Passport' },
] as const;

export const GOVT_ID_PLACEHOLDERS: Record<string, string> = {
  Aadhaar: '1234 5678 9012',
  PAN: 'ABCDE1234F',
  'Driving Licence': 'DL-01-2020-1234567',
  Passport: 'A1234567',
};
