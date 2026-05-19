'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import clsx from 'clsx';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  label?: string;
  disabled?: boolean;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  label = 'Enter verification code',
  disabled,
}: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (!disabled && value.length < length) {
      inputsRef.current[value.length]?.focus();
    }
  }, [disabled, length, value.length]);

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d)).join('').replace(/\s/g, '');
    onChange(next.slice(0, length));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]?.trim()) {
        updateAt(index, '');
      } else if (index > 0) {
        updateAt(index - 1, '');
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const num = raw.replace(/\D/g, '');
    if (!num) {
      updateAt(index, '');
      return;
    }
    if (num.length === 1) {
      updateAt(index, num);
      if (index < length - 1) inputsRef.current[index + 1]?.focus();
      return;
    }
    const merged = (value.slice(0, index) + num).slice(0, length);
    onChange(merged);
    inputsRef.current[Math.min(merged.length, length - 1)]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) onChange(pasted);
  };

  return (
    <div className={clsx('neo-otp-field', disabled && 'opacity-60')}>
      <label className="neo-field-label">{label}</label>
      <div className="neo-otp-row" role="group" aria-label={label}>
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={digits[i]?.trim() ? digits[i] : ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={clsx('neo-otp-cell', digits[i]?.trim() && 'neo-otp-cell--filled')}
            aria-label={`Digit ${i + 1} of ${length}`}
          />
        ))}
      </div>
    </div>
  );
}
