import { MemberPortalLayout } from '@/member/components/MemberPortalLayout';

export default function MemberRoleApprovalsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { role: string };
}) {
  return <MemberPortalLayout role={params.role}>{children}</MemberPortalLayout>;
}
