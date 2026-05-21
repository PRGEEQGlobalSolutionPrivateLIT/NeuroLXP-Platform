import { redirect } from 'next/navigation';
import { memberForgotPasswordRedirectPath } from '@/member/lib/member-last-role-server';

export default function Page() {
  redirect(memberForgotPasswordRedirectPath());
}
