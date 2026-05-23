'use client';

import { useParams, useRouter } from 'next/navigation';
import { MemberInvitePage } from '@/components/members/MemberInvitePage';
import { MemberRole } from '@/lib/members-api';

const ROLES: MemberRole[] = ['coordinator', 'faculty', 'student'];

export default function SuperAdminMemberInviteRoute() {
  const params = useParams();
  const router = useRouter();
  const role = (params.role as string)?.toLowerCase() as MemberRole;
  if (!ROLES.includes(role)) {
    return <p className="p-8 text-center text-red-600">Invalid role</p>;
  }
  return (
    <MemberInvitePage
      role={role}
      backHref="/superadmin/add-members"
      createdByType="super_admin"
      onBulkComplete={(bulkUploadId) =>
        router.push(`/superadmin/add-members?bulkUpload=${bulkUploadId}`)
      }
    />
  );
}
