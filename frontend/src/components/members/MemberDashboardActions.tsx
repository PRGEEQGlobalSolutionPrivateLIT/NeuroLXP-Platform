'use client';

import { useRouter } from 'next/navigation';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { MemberRole } from '@/lib/members-api';

const MEMBERS: { role: MemberRole; label: string }[] = [
  { role: 'coordinator', label: 'Add Coordinator' },
  { role: 'faculty', label: 'Add Faculty' },
  { role: 'student', label: 'Add Student' },
];

interface Props {
  basePath: '/platform-admin' | '/institution-admin' | '/superadmin';
}

export function MemberDashboardActions({ basePath }: Props) {
  const router = useRouter();

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-[var(--neo-text)]">Invite members</h2>
      <p className="mt-1 text-sm text-[var(--neo-muted)]">CSV bulk upload or single invite with email credentials</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {MEMBERS.map((m) => (
          <NeumorphicButton
            key={m.role}
            variant="primary"
            onClick={() => router.push(`${basePath}/members/${m.role}/invite`)}
          >
            {m.label}
          </NeumorphicButton>
        ))}
      </div>
    </div>
  );
}
