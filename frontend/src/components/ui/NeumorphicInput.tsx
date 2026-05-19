'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const NeumorphicInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className={clsx('space-y-0', className)}>
      {label && <label className="neo-field-label">{label}</label>}
      <div className="neo-inset px-4 py-1">
        <input
          ref={ref}
          className="neo-input-reset w-full py-3"
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-[var(--neo-muted)]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-[var(--neo-danger)]">{error}</p>}
    </div>
  ),
);
NeumorphicInput.displayName = 'NeumorphicInput';
