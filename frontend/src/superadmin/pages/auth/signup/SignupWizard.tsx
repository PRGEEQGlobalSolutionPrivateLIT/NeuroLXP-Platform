'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import neoToast from '@/lib/toast';
import { motion } from 'framer-motion';
import { StepLayout } from '@/components/layout/StepLayout';
import { NeumorphicInput } from '@/components/ui/NeumorphicInput';
import { NeumorphicDatePicker } from '@/components/ui/NeumorphicDatePicker';
import { NeumorphicSelect } from '@/components/ui/NeumorphicSelect';
import { NeumorphicCheckbox } from '@/components/ui/NeumorphicCheckbox';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { NeumorphicCard } from '@/components/ui/NeumorphicCard';
import { OTPInput } from '@/components/ui/OTPInput';
import { ContactVerificationCard } from '@/components/ui/ContactVerificationCard';
import { Modal } from '@/components/ui/Modal';
import { PasswordStrength, isPasswordValid } from '@/components/ui/PasswordStrength';
import { signupApi } from '@/lib/api';
import { SECURITY_QUESTION_POOL } from '@/lib/security-questions';
import { GOVT_ID_TYPES, GOVT_ID_PLACEHOLDERS } from '@/lib/govt-id';

const normEmail = (v: string) => v.trim().toLowerCase();
const normPhone = (v: string) => v.replace(/\D/g, '');

const DECLARATIONS = [
  { key: 'terms', label: 'Accept All Terms and Conditions' },
  { key: 'privacy', label: 'Privacy Acceptance' },
  { key: 'data', label: 'Data Sharing Agreement' },
  { key: 'use', label: 'Terms of Use' },
  { key: 'declaration', label: 'Terms of Declaration' },
];

const TOTAL = 12;

export function SignupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [altEmailOtp, setAltEmailOtp] = useState('');
  const [altPhoneOtp, setAltPhoneOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState<'email' | 'phone' | 'alt-email' | 'alt-phone' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [altEmail, setAltEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [altEmailVerified, setAltEmailVerified] = useState(false);
  const [altPhoneVerified, setAltPhoneVerified] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [qrProgress, setQrProgress] = useState(0);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [securityCodes, setSecurityCodes] = useState<string[]>([]);
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [codesSaved, setCodesSaved] = useState(false);
  const [selfie, setSelfie] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [selfieConfirmed, setSelfieConfirmed] = useState(false);
  const [govtType, setGovtType] = useState('Aadhaar');
  const [govtId, setGovtId] = useState('');
  const [sq, setSq] = useState({ q1: '', a1: '', q2: '', a2: '', q3: '', a3: '' });
  const [approver, setApprover] = useState({ name: '', designation: '', email: '', phone: '' });
  const [declarations, setDeclarations] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState<Record<string, unknown> | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; key: string; title: string }>({ open: false, key: '', title: '' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);

  const initSignup = useCallback(async () => {
    setInitLoading(true);
    setInitError(null);
    try {
      const { data } = await signupApi.initialize();
      setSessionId(data.sessionId);
      sessionStorage.setItem('signupSessionId', data.sessionId);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string; response?: { data?: { message?: string } } };
      const msg =
        err.code === 'ERR_NETWORK'
          ? 'Cannot reach API. Start the backend on port 3001 (npm run start:dev).'
          : err.response?.data?.message || err.message || 'Failed to start signup';
      setInitError(msg);
      neoToast.error(msg);
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    initSignup();
  }, [initSignup]);

  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try {
      await fn();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      neoToast.error(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const sendContactOtp = async (identifier: string, type: 'email' | 'sms') => {
    const { data } = await signupApi.sendOtp(sessionId, identifier, type);
    if (data.devOtp) {
      neoToast.success('OTP sent — use the dev code shown below');
    } else {
      neoToast.success('OTP sent successfully');
    }
    return { devOtp: data.devOtp as string | undefined };
  };

  const verifyOtpField = async (
    identifier: string,
    type: 'email' | 'sms',
    otp: string,
    field: string,
    onOk: () => void,
  ) => {
    await signupApi.verifyOtp(sessionId, identifier, type, otp, field);
    onOk();
    neoToast.success('Verified successfully');
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      neoToast.error('Camera access denied');
    }
  }, []);

  useEffect(() => {
    if (step === 9) startCamera();
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [step, startCamera]);

  const captureSelfie = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg');
    setSelfiePreview(dataUrl);
    setSelfie('');
    setSelfieConfirmed(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const useCapturedSelfie = () => {
    setSelfie(selfiePreview);
    setSelfieConfirmed(true);
    neoToast.success('Photo selected for verification');
  };

  const recaptureSelfie = () => {
    setSelfiePreview('');
    setSelfie('');
    setSelfieConfirmed(false);
    startCamera();
  };

  const altEmailSameAsPrimary = altEmail.trim() && normEmail(altEmail) === normEmail(primaryEmail);
  const altPhoneSameAsPrimary = altPhone.trim() && normPhone(altPhone) === normPhone(primaryPhone);

  const generateQr = () => {
    setQrProgress(0);
    const iv = setInterval(() => {
      setQrProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          return 100;
        }
        return p + 20;
      });
    }, 400);
    run(async () => {
      const { data } = await signupApi.totpSetup(sessionId);
      setQrCode(data.qrCodeDataUrl);
    });
  };

  const footer = (onNext: () => void, disabled?: boolean, label = 'Continue') => (
    <>
      {step > 1 && (
        <NeumorphicButton onClick={() => setStep((s) => s - 1)} disabled={loading}>
          Back
        </NeumorphicButton>
      )}
      <NeumorphicButton variant="primary" onClick={onNext} disabled={disabled || loading} loading={loading}>
        {label}
      </NeumorphicButton>
    </>
  );

  const renderStep = () => {
    if (initLoading) {
      return (
        <StepLayout mode="signup" currentStep={1} totalSteps={TOTAL} title="Preparing registration" subtitle="Setting up your secure session…">
          <div className="neo-inset flex items-center justify-center py-12 text-sm text-[var(--neo-muted)]">
            Loading…
          </div>
        </StepLayout>
      );
    }

    if (initError) {
      return (
        <StepLayout
          mode="signup"
          currentStep={1}
          totalSteps={TOTAL}
          title="Connection required"
          subtitle="The signup service could not be reached."
          footer={
            <NeumorphicButton variant="primary" onClick={initSignup} loading={initLoading}>
              Retry connection
            </NeumorphicButton>
          }
        >
          <div className="neo-alert neo-alert--warning">{initError}</div>
        </StepLayout>
      );
    }

    switch (step) {
      case 1:
        return (
          <StepLayout mode="signup" currentStep={1} totalSteps={TOTAL} title="Basic Information" subtitle="Enter your legal name and date of birth"
            footer={footer(() => run(async () => {
              if (!sessionId) { neoToast.error('Session not ready'); return; }
              if (!fullName || !dob) { neoToast.error('Fill all fields'); return; }
              await signupApi.step1(sessionId, { fullName, dateOfBirth: dob });
              setStep(2);
            }), !fullName || !dob || !sessionId)}>
            <NeumorphicInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As per legal document" />
            <NeumorphicDatePicker
              value={dob}
              onChange={setDob}
              max={new Date().toISOString().split('T')[0]}
              hint="Must match your government ID"
            />
          </StepLayout>
        );
      case 2:
        return (
          <StepLayout
            mode="signup"
            currentStep={2}
            totalSteps={TOTAL}
            title="Primary Email & Phone"
            subtitle="Verify both contacts with OTP before continuing."
            footer={footer(() => run(async () => {
              if (!emailVerified || !phoneVerified) { neoToast.error('Verify both email and phone'); return; }
              await signupApi.step2(sessionId, { primaryEmail, primaryPhone, emailVerified, phoneVerified });
              setStep(3);
            }), !emailVerified || !phoneVerified)}
          >
            <ContactVerificationCard
              label="Primary Email"
              kind="email"
              value={primaryEmail}
              onChange={setPrimaryEmail}
              verified={emailVerified}
              otp={emailOtp}
              onOtpChange={setEmailOtp}
              sending={otpBusy === 'email'}
              verifying={loading && otpBusy === 'email'}
              onSend={async () => {
                setOtpBusy('email');
                let payload: { devOtp?: string } | undefined;
                try {
                  await run(async () => {
                    payload = await sendContactOtp(primaryEmail, 'email');
                  });
                  return payload;
                } finally {
                  setOtpBusy(null);
                }
              }}
              onVerify={() =>
                run(async () => {
                  setOtpBusy('email');
                  await verifyOtpField(primaryEmail, 'email', emailOtp, 'primary_email_verified', () => setEmailVerified(true));
                }).finally(() => setOtpBusy(null))
              }
            />
            <ContactVerificationCard
              label="Primary Phone"
              kind="phone"
              value={primaryPhone}
              onChange={setPrimaryPhone}
              verified={phoneVerified}
              otp={phoneOtp}
              onOtpChange={setPhoneOtp}
              sending={otpBusy === 'phone'}
              verifying={loading && otpBusy === 'phone'}
              onSend={async () => {
                setOtpBusy('phone');
                let payload: { devOtp?: string } | undefined;
                try {
                  await run(async () => {
                    payload = await sendContactOtp(primaryPhone, 'sms');
                  });
                  return payload;
                } finally {
                  setOtpBusy(null);
                }
              }}
              onVerify={() =>
                run(async () => {
                  setOtpBusy('phone');
                  await verifyOtpField(primaryPhone, 'sms', phoneOtp, 'primary_phone_verified', () => setPhoneVerified(true));
                }).finally(() => setOtpBusy(null))
              }
            />
          </StepLayout>
        );
      case 3:
        return (
          <StepLayout mode="signup" currentStep={3} totalSteps={TOTAL} title="Set Password"
            footer={footer(() => run(async () => {
              if (!isPasswordValid(password) || password !== confirmPassword) {
                if (password !== confirmPassword) neoToast.error('Passwords do not match');
                return;
              }
              await signupApi.password(sessionId, password);
              setStep(4);
            }), !isPasswordValid(password) || password !== confirmPassword)}>
            <NeumorphicInput label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="mt-1 text-xs text-[var(--neo-primary)]" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'} password
            </button>
            <PasswordStrength password={password} />
            <NeumorphicInput label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </StepLayout>
        );
      case 4:
        return (
          <StepLayout mode="signup" currentStep={4} totalSteps={TOTAL} title="Your User ID"
            footer={footer(() => setStep(5), !userId, userId ? 'Continue' : 'Generate ID')}>
            {!userId ? (
              <NeumorphicButton variant="primary" onClick={() => run(async () => {
                const { data } = await signupApi.userId(sessionId);
                setUserId(data.userId);
              })} loading={loading}>Generate User ID</NeumorphicButton>
            ) : (
              <NeumorphicCard highlight>
                <p className="text-center font-mono text-xl font-bold tracking-wider text-[var(--neo-primary)]">{userId}</p>
                <p className="mt-3 text-center text-sm text-amber-700">This is your unique User ID. Save it safely.</p>
              </NeumorphicCard>
            )}
          </StepLayout>
        );
      case 5:
        return (
          <StepLayout
            mode="signup"
            currentStep={5}
            totalSteps={TOTAL}
            title="Alternative Contact"
            subtitle="Verify your backup email and phone number."
            footer={footer(() => run(async () => {
              await signupApi.altContact(sessionId, { altEmail, altPhone, emailVerified: altEmailVerified, phoneVerified: altPhoneVerified });
              setStep(6);
            }), !altEmailVerified || !altPhoneVerified || !!altEmailSameAsPrimary || !!altPhoneSameAsPrimary)}>
            {(altEmailSameAsPrimary || altPhoneSameAsPrimary) && (
              <div className="neo-alert-inline neo-alert-inline--warning">
                {altEmailSameAsPrimary && altPhoneSameAsPrimary
                  ? 'Alternative email and phone must be different from your primary contacts.'
                  : altEmailSameAsPrimary
                    ? 'Alternative email must be different from your primary email.'
                    : 'Alternative phone must be different from your primary phone.'}
              </div>
            )}
            <ContactVerificationCard
              label="Alternative Email"
              kind="email"
              value={altEmail}
              onChange={setAltEmail}
              verified={altEmailVerified}
              otp={altEmailOtp}
              onOtpChange={setAltEmailOtp}
              sending={otpBusy === 'alt-email'}
              verifying={loading && otpBusy === 'alt-email'}
              onSend={async () => {
                setOtpBusy('alt-email');
                let payload: { devOtp?: string } | undefined;
                try {
                  await run(async () => {
                    payload = await sendContactOtp(altEmail, 'email');
                  });
                  return payload;
                } finally {
                  setOtpBusy(null);
                }
              }}
              onVerify={() =>
                run(async () => {
                  setOtpBusy('alt-email');
                  await verifyOtpField(altEmail, 'email', altEmailOtp, 'alt_email_verified', () => setAltEmailVerified(true));
                }).finally(() => setOtpBusy(null))
              }
            />
            <ContactVerificationCard
              label="Alternative Phone"
              kind="phone"
              value={altPhone}
              onChange={setAltPhone}
              verified={altPhoneVerified}
              otp={altPhoneOtp}
              onOtpChange={setAltPhoneOtp}
              sending={otpBusy === 'alt-phone'}
              verifying={loading && otpBusy === 'alt-phone'}
              onSend={async () => {
                setOtpBusy('alt-phone');
                let payload: { devOtp?: string } | undefined;
                try {
                  await run(async () => {
                    payload = await sendContactOtp(altPhone, 'sms');
                  });
                  return payload;
                } finally {
                  setOtpBusy(null);
                }
              }}
              onVerify={() =>
                run(async () => {
                  setOtpBusy('alt-phone');
                  await verifyOtpField(altPhone, 'sms', altPhoneOtp, 'alt_phone_verified', () => setAltPhoneVerified(true));
                }).finally(() => setOtpBusy(null))
              }
            />
          </StepLayout>
        );
      case 6:
        return (
          <StepLayout mode="signup" currentStep={6} totalSteps={TOTAL} title="Google Authenticator"
            footer={footer(() => run(async () => {
              await signupApi.totpVerify(sessionId, totpCode);
              setStep(7);
            }), totpCode.length !== 6)}>
            {!qrCode ? (
              <>
                {qrProgress > 0 && qrProgress < 100 && (
                  <div className="neo-inset mb-4 h-2 overflow-hidden rounded-full">
                    <motion.div className="h-full bg-[var(--neo-primary)]" style={{ width: `${qrProgress}%` }} />
                  </div>
                )}
                <NeumorphicButton variant="primary" onClick={generateQr} loading={loading}>Generate QR Code</NeumorphicButton>
              </>
            ) : (
              <div className="neo-form-stack">
                <div className="neo-inset mx-auto w-fit rounded-2xl p-3">
                  <img src={qrCode} alt="TOTP QR" className="rounded-lg" width={200} height={200} />
                </div>
                <p className="text-center text-sm text-[var(--neo-muted)]">
                  Scan with Google Authenticator, then enter the 6-digit code
                </p>
                <OTPInput value={totpCode} onChange={setTotpCode} label="Authenticator code" />
              </div>
            )}
          </StepLayout>
        );
      case 7:
        return (
          <StepLayout mode="signup" currentStep={7} totalSteps={TOTAL} title="Recovery Code"
            footer={footer(() => setStep(8), !recoverySaved)}>
            {!recoveryCode ? (
              <NeumorphicButton variant="primary" onClick={() => run(async () => {
                const { data } = await signupApi.recoveryCode(sessionId);
                setRecoveryCode(data.recoveryCode);
              })} loading={loading}>Generate Recovery Code</NeumorphicButton>
            ) : (
              <div className="neo-form-stack">
                <div className="neo-secret-panel">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--neo-muted)]">
                    Your recovery code
                  </p>
                  <p className="neo-secret-code">{recoveryCode}</p>
                </div>
                <p className="neo-alert-inline neo-alert-inline--warning text-center">
                  Save this code somewhere safe. Do not share. It regenerates after each use.
                </p>
                <NeumorphicCheckbox
                  checked={recoverySaved}
                  onChange={setRecoverySaved}
                  label="I have saved my recovery code safely"
                />
              </div>
            )}
          </StepLayout>
        );
      case 8:
        return (
          <StepLayout mode="signup" currentStep={8} totalSteps={TOTAL} title="Security Codes"
            footer={footer(() => setStep(9), !codesSaved)}>
            {securityCodes.length === 0 ? (
              <NeumorphicButton variant="primary" onClick={() => run(async () => {
                const { data } = await signupApi.securityCodes(sessionId);
                setSecurityCodes(data.codes);
              })} loading={loading}>Generate Security Codes</NeumorphicButton>
            ) : (
              <div className="neo-form-stack">
                <p className="text-center text-sm text-[var(--neo-muted)]">
                  Store each code in a secure place. Each can be used once.
                </p>
                <SecurityCodesGrid codes={securityCodes} />
                <NeumorphicCheckbox
                  checked={codesSaved}
                  onChange={setCodesSaved}
                  label="I have saved all security codes safely"
                />
              </div>
            )}
          </StepLayout>
        );
      case 9:
        return (
          <StepLayout mode="signup" currentStep={9} totalSteps={TOTAL} title="Identity Verification"
            footer={footer(() => run(async () => {
              await signupApi.identity(sessionId, { selfieBase64: selfie, govtIdType: govtType, govtIdNumber: govtId });
              neoToast.success('Identity verified and saved successfully');
              setStep(10);
            }), !selfieConfirmed || !govtId)}>
            {!selfiePreview && !selfie ? (
              <>
                <div className="neo-camera-frame">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                </div>
                <NeumorphicButton variant="primary" onClick={captureSelfie}>
                  Capture Photo
                </NeumorphicButton>
              </>
            ) : (
              <div className="neo-form-stack">
                <div className="neo-selfie-preview neo-inset overflow-hidden rounded-2xl">
                  <img
                    src={selfieConfirmed ? selfie : selfiePreview}
                    alt="Selfie preview"
                    className="mx-auto max-h-52 w-full object-cover"
                  />
                </div>
                <div className="neo-selfie-actions">
                  <NeumorphicButton onClick={recaptureSelfie}>Re-capture</NeumorphicButton>
                  <NeumorphicButton variant="primary" onClick={useCapturedSelfie} disabled={selfieConfirmed}>
                    {selfieConfirmed ? 'Photo selected' : 'Use this photo'}
                  </NeumorphicButton>
                </div>
              </div>
            )}
            <NeumorphicSelect
              label="Government ID Type"
              value={govtType}
              onChange={setGovtType}
              options={[...GOVT_ID_TYPES]}
            />
            <NeumorphicInput
              label="Government ID Number"
              value={govtId}
              onChange={(e) => setGovtId(e.target.value)}
              placeholder={GOVT_ID_PLACEHOLDERS[govtType] ?? 'Enter ID number'}
            />
          </StepLayout>
        );
      case 10:
        return (
          <StepLayout mode="signup" currentStep={10} totalSteps={TOTAL} title="Security Questions & Approver"
            footer={footer(() => run(async () => {
              const chosen = [sq.q1, sq.q2, sq.q3];
              if (chosen.some((q) => !q) || chosen.some((_, i, arr) => arr.indexOf(chosen[i]) !== i)) {
                neoToast.error('Choose 3 different security questions');
                return;
              }
              if (!sq.a1.trim() || !sq.a2.trim() || !sq.a3.trim()) {
                neoToast.error('Answer all three security questions');
                return;
              }
              await signupApi.securityQA(sessionId, {
                q1: sq.q1, a1: sq.a1, q2: sq.q2, a2: sq.a2, q3: sq.q3, a3: sq.a3,
                approverName: approver.name, approverDesignation: approver.designation,
                approverEmail: approver.email, approverPhone: approver.phone,
              });
              setStep(11);
            }), !sq.q1 || !sq.q2 || !sq.q3 || !sq.a1 || !sq.a2 || !sq.a3 || !approver.name || !approver.email)}>
            <p className="text-sm text-[var(--neo-muted)]">Select any 3 unique questions from the list below.</p>
            {[1, 2, 3].map((n) => (
              <SecurityQuestionRow key={n} index={n} sq={sq} setSq={setSq} />
            ))}
            <h3 className="neo-section-title">Secondary Person Approver</h3>
            <NeumorphicInput label="Approver Full Name" value={approver.name} onChange={(e) => setApprover({ ...approver, name: e.target.value })} />
            <NeumorphicInput label="Designation" value={approver.designation} onChange={(e) => setApprover({ ...approver, designation: e.target.value })} />
            <NeumorphicInput label="Approver Email" type="email" value={approver.email} onChange={(e) => setApprover({ ...approver, email: e.target.value })} />
            <NeumorphicInput label="Approver Phone" type="tel" value={approver.phone} onChange={(e) => setApprover({ ...approver, phone: e.target.value })} />
          </StepLayout>
        );
      case 11:
        return (
          <StepLayout mode="signup" currentStep={11} totalSteps={TOTAL} title="Declarations & Privacy"
            footer={footer(() => run(async () => {
              await signupApi.declarations(sessionId, declarations);
              const { data } = await signupApi.review(sessionId);
              setReview(data);
              setStep(12);
            }), DECLARATIONS.some((d) => !declarations[d.key]))}>
            {DECLARATIONS.map((d) => (
              <NeumorphicCheckbox
                key={d.key}
                className="mb-3"
                checked={!!declarations[d.key]}
                onChange={() => undefined}
                disabled
                label={
                  <button
                    type="button"
                    className="text-left font-medium text-[var(--neo-primary)] hover:underline"
                    onClick={() => setModal({ open: true, key: d.key, title: d.label })}
                  >
                    {d.label}
                  </button>
                }
              />
            ))}
            <Modal open={modal.open} title={modal.title} onClose={() => setModal({ ...modal, open: false })}
              onScrollBottom={() => {
                setDeclarations((prev) => ({ ...prev, [modal.key]: true }));
                setModal({ ...modal, open: false });
              }}>
              <p className="mb-4">Please read this document carefully. Scroll to the bottom to accept.</p>
              {Array.from({ length: 20 }).map((_, i) => <p key={i} className="mb-2">Lorem ipsum section {i + 1} of the {modal.title}.</p>)}
            </Modal>
          </StepLayout>
        );
      case 12:
        return (
          <StepLayout mode="signup" currentStep={12} totalSteps={TOTAL} title="Review & Register"
            footer={footer(() => run(async () => {
              const { data } = await signupApi.complete(sessionId);
              localStorage.setItem('recoveryCode', data.recoveryCode);
              router.push(`/superadmin/auth/signup/success?recoveryCode=${encodeURIComponent(data.recoveryCode)}`);
            }), !reviewConfirmed, 'Register')}>
            <div className="grid gap-3 sm:grid-cols-2">
              {review && Object.entries(review).filter(([, v]) => v).map(([k, v]) => (
                <NeumorphicCard key={k} className="!p-3">
                  <p className="text-xs text-[var(--neo-muted)]">{k.replace(/_/g, ' ')}</p>
                  <p className="truncate text-sm font-medium">{String(v)}</p>
                </NeumorphicCard>
              ))}
            </div>
            <NeumorphicCheckbox
              className="mt-6"
              checked={reviewConfirmed}
              onChange={setReviewConfirmed}
              label="I have reviewed all information and confirm registration."
            />
          </StepLayout>
        );
      default:
        return null;
    }
  };

  return renderStep();
}

function patchSq(
  sq: { q1: string; a1: string; q2: string; a2: string; q3: string; a3: string },
  key: keyof typeof sq,
  value: string,
) {
  return { ...sq, [key]: value };
}

function SecurityQuestionRow({
  index,
  sq,
  setSq,
}: {
  index: number;
  sq: { q1: string; a1: string; q2: string; a2: string; q3: string; a3: string };
  setSq: (v: typeof sq) => void;
}) {
  const qKey = `q${index}` as 'q1' | 'q2' | 'q3';
  const aKey = `a${index}` as 'a1' | 'a2' | 'a3';
  const otherSelected = [sq.q1, sq.q2, sq.q3].filter(Boolean);
  const available = SECURITY_QUESTION_POOL.filter(
    (q) => q === sq[qKey] || !otherSelected.includes(q),
  );

  return (
    <div className="neo-form-stack !gap-3">
      <NeumorphicSelect
        label={`Security question ${index}`}
        value={sq[qKey]}
        onChange={(v) => setSq(patchSq(sq, qKey, v))}
        placeholder={`Select question ${index}`}
        options={available.map((q) => ({ value: q, label: q }))}
      />
      <NeumorphicInput
        label={`Answer ${index}`}
        value={sq[aKey]}
        onChange={(e) => setSq(patchSq(sq, aKey, e.target.value))}
        placeholder="Your answer"
      />
    </div>
  );
}

function SecurityCodesGrid({ codes }: { codes: string[] }) {
  return (
    <div className="neo-secret-grid">
      {codes.map((c, i) => (
        <div key={`${c}-${i}`} className="neo-secret-tile">
          <span className="neo-secret-tile-index">Code {i + 1}</span>
          <span className="neo-secret-tile-value">{c}</span>
        </div>
      ))}
    </div>
  );
}
