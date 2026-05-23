import { redirect } from 'next/navigation';

export default function SuperAdminActoresRedirect() {
  redirect('/superadmin/add-members');
}
