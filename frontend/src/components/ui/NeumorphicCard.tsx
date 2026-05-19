'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

export function NeumorphicCard({
  children,
  className,
  highlight,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'neo-raised p-5',
        highlight && 'ring-2 ring-[var(--neo-primary)]/25',
        className,
      )}
    >
      {children}
    </div>
  );
}
