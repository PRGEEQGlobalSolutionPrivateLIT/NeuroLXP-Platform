'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
}

export function NeumorphicSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled,
  className,
  hint,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={clsx('neo-select-field relative', className)}>
      {label && <label className="neo-field-label">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        className={clsx('neo-select-trigger neo-inset', open && 'neo-select-trigger--open')}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={clsx('neo-select-trigger-text', !selected && 'text-[var(--neo-muted)]')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={clsx('neo-select-chevron h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="neo-select-menu"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {options.map((o) => (
              <li key={o.value} role="option" aria-selected={value === o.value}>
                <button
                  type="button"
                  className={clsx('neo-select-option', value === o.value && 'neo-select-option--active')}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                  {value === o.value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {hint && <p className="mt-1.5 text-xs text-[var(--neo-muted)]">{hint}</p>}
    </div>
  );
}
