'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCheckbox } from '@/components/ui/NeumorphicCheckbox';
import neoToast from '@/lib/toast';

const ALERT_DURATION_SEC = 60;

interface Props {
  recoveryCode: string;
  userId?: string;
  onDismiss: () => void;
}

export function RecoveryCodeAlertModal({ recoveryCode, userId, onDismiss }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(ALERT_DURATION_SEC);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, onDismiss]);

  const copyAll = async () => {
    const text = userId
      ? `User ID: ${userId}\nRecovery code: ${recoveryCode}`
      : recoveryCode;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      neoToast.success('Copied to clipboard');
    } catch {
      neoToast.error('Could not copy — select and copy manually');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-labelledby="recovery-alert-title"
        className={clsx(
          'neo-card w-full max-w-md border-4 !p-6 shadow-2xl transition-colors duration-300',
          copied ? 'border-green-500' : 'border-red-500',
        )}
      >
        <p className="neo-kicker text-left !text-red-600">Security alert</p>
        <h2 id="recovery-alert-title" className="mt-1 text-xl font-bold text-[var(--neo-text)]">
          {userId ? 'Save your credentials' : 'Save your new recovery code'}
        </h2>
        <p className="mt-2 text-sm text-[var(--neo-muted)]">
          {userId
            ? 'Your account is ready. Copy and store these before this alert closes.'
            : 'A new recovery code is now active. Copy and store it before this alert closes.'}
        </p>

        <div className="neo-alert neo-alert--warning mt-4 text-sm">
          Closes automatically in <strong>{secondsLeft}</strong> second{secondsLeft === 1 ? '' : 's'}
        </div>

        {userId && (
          <>
            <p className="neo-field-label mt-4">Your User ID</p>
            <p className="mt-1 break-all rounded-lg bg-[var(--neo-bg)] px-3 py-3 font-mono text-sm font-bold text-[var(--neo-primary)]">
              {userId}
            </p>
          </>
        )}

        <p className="neo-field-label mt-4">{userId ? 'Recovery code' : 'New recovery code'}</p>
        <p className="mt-1 break-all rounded-lg bg-[var(--neo-bg)] px-3 py-3 font-mono text-sm font-bold text-[var(--neo-primary)]">
          {recoveryCode}
        </p>

        <NeumorphicButton variant="primary" className="mt-4 w-full" onClick={copyAll}>
          {copied ? 'Copied' : userId ? 'Copy all' : 'Copy recovery code'}
        </NeumorphicButton>

        <NeumorphicCheckbox
          className="mt-4"
          checked={saved}
          onChange={setSaved}
          label={
            userId
              ? 'I have saved my User ID and recovery code safely'
              : 'I have saved this recovery code safely'
          }
        />

        {!saved && (
          <p className="mt-2 text-xs text-[var(--neo-muted)]">
            Tick the box once you have stored {userId ? 'both' : 'the code'}.
          </p>
        )}
      </div>
    </div>
  );
}

export const PLATFORM_RECOVERY_STORAGE_KEY = 'platformPendingRecoveryCode';
export const INSTITUTION_RECOVERY_STORAGE_KEY = 'institutionPendingRecoveryCode';
