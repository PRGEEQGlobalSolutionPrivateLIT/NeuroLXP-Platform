'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function NeumorphicCheckbox({ checked, onChange, label, disabled, className }: Props) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer items-start gap-3 text-sm text-[var(--neo-text)]',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx('neo-checkbox mt-0.5', checked && 'neo-checkbox--checked')}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}
