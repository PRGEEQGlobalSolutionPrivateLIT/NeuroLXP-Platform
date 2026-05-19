'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Mail, Phone, CheckCircle2, LucideIcon } from 'lucide-react';
import { NeumorphicInput } from './NeumorphicInput';
import { NeumorphicButton } from './NeumorphicButton';
import { OTPInput } from './OTPInput';
import { DevOtpBanner } from './DevOtpBanner';

interface Props {
  label: string;
  kind: 'email' | 'phone';
  value: string;
  onChange: (v: string) => void;
  verified: boolean;
  otp: string;
  onOtpChange: (v: string) => void;
  onSend: () => Promise<{ devOtp?: string } | void>;
  onVerify: () => void;
  sending?: boolean;
  verifying?: boolean;
  placeholder?: string;
}

export function ContactVerificationCard({
  label,
  kind,
  value,
  onChange,
  verified,
  otp,
  onOtpChange,
  onSend,
  onVerify,
  sending,
  verifying,
  placeholder,
}: Props) {
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const Icon: LucideIcon = kind === 'email' ? Mail : Phone;

  const handleSend = async () => {
    const result = await onSend();
    setOtpSent(true);
    if (result && typeof result === 'object' && result.devOtp) {
      setDevOtp(result.devOtp);
    }
  };

  return (
    <div className={clsx('neo-verify-card', verified && 'neo-verify-card--verified')}>
      <div className="neo-verify-card-header">
        <span className="neo-verify-card-icon">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="neo-verify-card-title">{label}</span>
        {verified && (
          <span className="neo-badge-success ml-auto inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </span>
        )}
      </div>

      <NeumorphicInput
        label={kind === 'email' ? 'Email address' : 'Mobile number'}
        type={kind === 'email' ? 'email' : 'tel'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={verified}
        placeholder={placeholder ?? (kind === 'email' ? 'name@company.com' : '+91 98765 43210')}
        autoComplete={kind === 'email' ? 'email' : 'tel'}
      />

      {!verified && (
        <div className="neo-verify-otp-section">
          {devOtp && <DevOtpBanner code={devOtp} />}

          <OTPInput value={otp} onChange={onOtpChange} disabled={!otpSent && !devOtp} />

          <div className="neo-verify-actions">
            <NeumorphicButton onClick={handleSend} loading={sending} disabled={!value.trim()}>
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={onVerify}
              loading={verifying}
              disabled={otp.length !== 6 || !value.trim()}
            >
              Verify
            </NeumorphicButton>
          </div>
        </div>
      )}
    </div>
  );
}