'use client';

import { Modal } from '@/components/ui/Modal';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

interface Props {
  open: boolean;
  onClose: () => void;
  allowFallback: boolean;
  onForgotPassword: () => void;
  onFallbackTotp: () => void;
  onFallbackRecovery: () => void;
}

export function MemberSigninHelpModal({
  open,
  onClose,
  allowFallback,
  onForgotPassword,
  onFallbackTotp,
  onFallbackRecovery,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Sign-in didn't work">
      <p>
        Your email, User ID, phone number, or password may be incorrect. Choose how you would like to
        continue — you will not be moved to another method automatically.
      </p>

      <div className="mt-6 rounded-xl bg-[var(--neo-bg)] p-4">
        <p className="font-semibold text-[var(--neo-text)]">Forgot your password?</p>
        <p className="mt-1">
          Reset it with a new password and a one-time code sent to your registered email.
        </p>
        <NeumorphicButton className="mt-3" variant="primary" onClick={onForgotPassword}>
          Reset password
        </NeumorphicButton>
      </div>

      {allowFallback ? (
        <div className="mt-4 rounded-xl bg-[var(--neo-bg)] p-4">
          <p className="font-semibold text-[var(--neo-text)]">Use a fallback sign-in method</p>
          <p className="mt-1">Select one option below (set up during onboarding).</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <NeumorphicButton className="flex-1" variant="primary" onClick={onFallbackTotp}>
              Google Authenticator
            </NeumorphicButton>
            <NeumorphicButton className="flex-1" variant="primary" onClick={onFallbackRecovery}>
              Recovery code
            </NeumorphicButton>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs">
          Fallback sign-in is only available when your account was found but the password was wrong.
          Check your email, User ID, or phone and try again.
        </p>
      )}

      <NeumorphicButton className="mt-6 w-full" onClick={onClose}>
        Back to sign in
      </NeumorphicButton>
    </Modal>
  );
}
