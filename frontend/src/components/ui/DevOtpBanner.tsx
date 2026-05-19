'use client';

interface Props {
  code: string;
}

/** Shown in development when the API returns the OTP for testing */
export function DevOtpBanner({ code }: Props) {
  return (
    <div className="neo-dev-otp-hint">
      <strong>Dev OTP:</strong>{' '}
      <code className="font-mono text-base tracking-widest">{code}</code>
      <span className="mt-1 block text-xs opacity-90">Also in backend console / DevOTP dashboard</span>
    </div>
  );
}
