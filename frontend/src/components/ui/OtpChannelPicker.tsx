'use client';

import clsx from 'clsx';
import { Mail, Smartphone } from 'lucide-react';

interface Props {
  emailLabel: string;
  phoneLabel: string;
  selected: 'email' | 'phone' | null;
  onSelect: (channel: 'email' | 'phone') => void;
}

export function OtpChannelPicker({ emailLabel, phoneLabel, selected, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect('email')}
        className={clsx('neo-btn-option', selected === 'email' && 'neo-btn-option--active')}
      >
        <Mail className="mb-2 h-5 w-5 text-[var(--neo-primary)]" />
        <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--neo-muted)]">Email</span>
        <span className="mt-1 block text-sm font-medium text-[var(--neo-text)]">{emailLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelect('phone')}
        className={clsx('neo-btn-option', selected === 'phone' && 'neo-btn-option--active')}
      >
        <Smartphone className="mb-2 h-5 w-5 text-[var(--neo-primary)]" />
        <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--neo-muted)]">Phone</span>
        <span className="mt-1 block text-sm font-medium text-[var(--neo-text)]">{phoneLabel}</span>
      </button>
    </div>
  );
}
