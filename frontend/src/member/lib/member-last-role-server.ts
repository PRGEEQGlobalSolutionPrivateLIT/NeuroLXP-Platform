import { cookies } from 'next/headers';
import { MemberRole } from '@/lib/members-api';
import { isMemberRole, MEMBER_LAST_ROLE_KEY, memberPaths } from '@/member/lib/member-routes';

export function memberLastRoleFromRequest(): MemberRole {
  const role = cookies().get(MEMBER_LAST_ROLE_KEY)?.value;
  return isMemberRole(role) ? role : 'student';
}

export function memberSigninRedirectPath() {
  return memberPaths(memberLastRoleFromRequest()).signin;
}

export function memberForgotPasswordRedirectPath() {
  return memberPaths(memberLastRoleFromRequest()).forgotPassword;
}
