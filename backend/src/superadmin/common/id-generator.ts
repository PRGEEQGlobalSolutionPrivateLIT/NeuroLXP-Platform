const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomAlpha(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
  }
  return s;
}

/** PRGEEQ + R(first letter of name) + random alphanumeric */
export function generateUserId(fullName: string): string {
  const first = (fullName.trim().charAt(0) || 'X').toUpperCase();
  return `PRGEEQ${first}${randomAlpha(8)}`;
}

/** PRGEEQ + random alphanumeric = 25 chars total */
export function generateRecoveryCode(): string {
  return `PRGEEQ${randomAlpha(19)}`;
}

/** 9 unique 6-character security codes */
export function generateSecurityCodes(count = 9): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(randomAlpha(6));
  }
  return Array.from(codes);
}

/** 15-character alphanumeric approval code */
export function generateApprovalCode(): string {
  return randomAlpha(15);
}
