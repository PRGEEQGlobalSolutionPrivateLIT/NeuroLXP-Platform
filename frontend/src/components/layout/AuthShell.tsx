'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export function AuthShell({
  children,
  brand = 'NeuroLXP',
  portalTitle = 'Super Admin Portal',
  tagline,
  footerLink,
}: {
  children: ReactNode;
  brand?: string;
  portalTitle?: string;
  tagline?: string;
  footerLink?: { href: string; label: string };
}) {
  return (
    <div className="neo-page relative flex min-h-screen items-center justify-center p-4 md:p-8">
      <div className="relative z-10 w-full max-w-xl px-0 sm:max-w-2xl">
        <header className="mb-6 text-center">
          <div className="neo-raised mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
            <span className="text-xl font-bold text-[var(--neo-primary)]">N</span>
          </div>
          <p className="neo-kicker">{brand}</p>
          <h1 className="neo-heading mt-2">{portalTitle}</h1>
          {tagline ? <p className="neo-subheading mt-2">{tagline}</p> : null}
        </header>
        {children}
        {footerLink ? (
          <p className="mt-6 text-center text-sm text-[var(--neo-muted)]">
            <Link href={footerLink.href} className="font-semibold text-[var(--neo-primary)] hover:underline">
              {footerLink.label}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
