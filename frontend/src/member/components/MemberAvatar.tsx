'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { getStoredMemberAvatar, memberInitialsFromName } from '@/member/lib/member-avatar';

interface Props {
  memberId?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ring?: boolean;
}

const SIZES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-24 w-24 text-2xl',
  lg: 'h-[88px] w-[88px] text-2xl',
};

export function MemberAvatar({ memberId, name, size = 'md', className, ring }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(getStoredMemberAvatar(memberId));
    const refresh = () => setSrc(getStoredMemberAvatar(memberId));
    window.addEventListener('member-avatar-updated', refresh);
    return () => window.removeEventListener('member-avatar-updated', refresh);
  }, [memberId]);

  const initials = memberInitialsFromName(name);

  return (
    <div className={clsx(ring && 'sa-avatar-ring', !ring && 'overflow-hidden rounded-full', className)}>
      {src ? (
        <img
          src={src}
          alt=""
          className={clsx('rounded-full object-cover', SIZES[size], ring && 'sa-avatar')}
        />
      ) : (
        <div
          className={clsx(
            'flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--neo-primary)] to-[var(--neo-primary-light)] font-bold text-white shadow-inner',
            SIZES[size],
            ring && 'sa-avatar',
          )}
          aria-hidden
        >
          {initials}
        </div>
      )}
    </div>
  );
}
