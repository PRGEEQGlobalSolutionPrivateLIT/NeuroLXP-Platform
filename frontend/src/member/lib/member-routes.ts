import { MemberRole } from '@/lib/members-api';

export const MEMBER_LAST_ROLE_KEY = 'memberLastRole';

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  coordinator: 'Coordinator',
};

export const MEMBER_PORTAL_TITLE: Record<MemberRole, string> = {
  student: 'Student Portal',
  faculty: 'Faculty Portal',
  coordinator: 'Coordinator Portal',
};

export const MEMBER_PORTAL_TAGLINE: Record<MemberRole, string> = {
  student: 'Secure student access',
  faculty: 'Secure faculty access',
  coordinator: 'Secure coordinator access',
};

/** Label shown in Google Authenticator when scanning member TOTP QR */
export const MEMBER_TOTP_APP_LABEL: Record<MemberRole, string> = {
  student: 'NeuroLXP Student',
  faculty: 'NeuroLXP Faculty',
  coordinator: 'NeuroLXP Coordinator',
};

export function isMemberRole(value: string | undefined | null): value is MemberRole {
  return value === 'student' || value === 'faculty' || value === 'coordinator';
}

export function persistMemberLastRole(role: MemberRole) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEMBER_LAST_ROLE_KEY, role);
  document.cookie = `${MEMBER_LAST_ROLE_KEY}=${role};path=/;max-age=31536000;SameSite=Lax`;
}

export function getMemberLastRole(): MemberRole {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MEMBER_LAST_ROLE_KEY);
    if (isMemberRole(stored)) return stored;
    const match = document.cookie.match(new RegExp(`${MEMBER_LAST_ROLE_KEY}=([^;]+)`));
    if (isMemberRole(match?.[1])) return match[1];
  }
  return 'student';
}

export function defaultMemberSigninPath() {
  return memberPaths(getMemberLastRole()).signin;
}

export function memberAuthShellProps(role: MemberRole) {
  return {
    portalTitle: MEMBER_PORTAL_TITLE[role],
    tagline: MEMBER_PORTAL_TAGLINE[role],
    footerLink: null,
  };
}

export function memberPageTitle(role: MemberRole, page: string) {
  return `${page} · ${MEMBER_PORTAL_TITLE[role]} · NeuroLXP`;
}

export const MEMBER_APPROVER_LABEL: Record<MemberRole, string> = {
  student: 'Coordinator',
  faculty: 'Coordinator',
  coordinator: 'Institution Admin',
};

export function memberRecoveryStorageKey(role: MemberRole) {
  return `memberPendingRecoveryCode_${role}`;
}

export function memberUserIdStorageKey(role: MemberRole) {
  return `memberNewUserId_${role}`;
}

export function memberPaths(role: MemberRole) {
  const base = `/member/${role}`;
  return {
    signin: `${base}/auth/signin`,
    magic: `${base}/auth/magic`,
    onboarding: `${base}/auth/onboarding`,
    forgotPassword: `${base}/auth/forgot-password`,
    dashboard: `${base}/dashboard`,
    profile: `${base}/profile`,
    approvals: `${base}/approvals`,
  };
}

/** Legacy paths → role-scoped dashboard (for bookmarks). */
export function memberLegacyDashboardRedirectPath(): string {
  return memberPaths(getMemberLastRole()).dashboard;
}
