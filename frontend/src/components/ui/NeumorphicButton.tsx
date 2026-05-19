'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'raised';
  loading?: boolean;
}

export function NeumorphicButton({
  variant = 'raised',
  loading,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={clsx(
        'min-w-[120px] px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50',
        variant === 'primary' ? 'neo-btn-primary' : 'neo-btn-raised',
        className,
      )}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
