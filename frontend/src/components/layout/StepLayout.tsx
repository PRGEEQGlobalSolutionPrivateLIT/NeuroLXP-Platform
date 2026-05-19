'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AuthShell } from '@/components/layout/AuthShell';
import Link from 'next/link';

export function StepLayout({
  title,
  subtitle,
  currentStep,
  totalSteps,
  mode,
  children,
  footer,
  backHref,
  showBrand = true,
}: {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  mode: 'signup' | 'signin';
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  showBrand?: boolean;
}) {
  const card = (
    <div className="neo-card w-full p-6 md:p-9">
      <ProgressBar current={currentStep} total={totalSteps} mode={mode} />
      <motion.div
        key={`${mode}-${currentStep}-${title}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--neo-primary)] hover:underline"
          >
            ← Back
          </Link>
        )}
        <div className="mb-6 border-b border-[var(--neo-shadow-dark)]/15 pb-5">
          <h2 className="text-xl font-bold tracking-tight text-[var(--neo-text)] md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-[var(--neo-muted)]">{subtitle}</p>}
        </div>
        <div className="neo-form-stack">{children}</div>
      </motion.div>
      {footer && (
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--neo-shadow-dark)]/10 pt-6 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </div>
  );

  if (!showBrand) {
    return (
      <div className="neo-page relative flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="relative z-10 w-full max-w-xl sm:max-w-2xl">{card}</div>
      </div>
    );
  }

  return (
    <AuthShell
      tagline={mode === 'signup' ? 'Secure administrator registration' : 'Secure administrator access'}
      footerLink={
        mode === 'signup'
          ? { href: '/superadmin/auth/signin', label: 'Already have an account? Sign in' }
          : { href: '/superadmin/auth/signup', label: 'Need an account? Register' }
      }
    >
      {card}
    </AuthShell>
  );
}
