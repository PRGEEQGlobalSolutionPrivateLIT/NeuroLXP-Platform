import { redirect } from 'next/navigation';
import { memberSigninRedirectPath } from '@/member/lib/member-last-role-server';

export default function Page() {
  redirect(memberSigninRedirectPath());
}
