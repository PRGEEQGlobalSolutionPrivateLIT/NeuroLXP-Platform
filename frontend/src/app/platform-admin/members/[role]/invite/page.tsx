'use client';

import { useParams, useRouter } from 'next/navigation';
import { MemberInvitePage } from '@/components/members/MemberInvitePage';
import { MemberRole } from '@/lib/members-api';

const ROLES: MemberRole[] = ['coordinator', 'faculty', 'student'];

export default function PlatformMemberInviteRoute() {
  const params = useParams();
  const router = useRouter();
  const role = (params.role as string)?.toLowerCase() as MemberRole;
  if (!ROLES.includes(role)) {
    return <p className="p-8 text-center text-red-600">Invalid role</p>;
  }
  return (
    <MemberInvitePage
      role={role}
      backHref="/platform-admin/add-members"
      createdByType="platform_admin"
      onBulkComplete={(bulkUploadId) =>
        router.push(`/platform-admin/add-members?bulkUpload=${bulkUploadId}`)
      }
    />
  );
}
