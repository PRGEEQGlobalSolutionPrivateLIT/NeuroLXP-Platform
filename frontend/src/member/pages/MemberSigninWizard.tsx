'use client';



import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import neoToast from '@/lib/toast';

import { StepLayout } from '@/components/layout/StepLayout';

import { NeumorphicInput } from '@/components/ui/NeumorphicInput';

import { NeumorphicButton } from '@/components/ui/NeumorphicButton';

import { NeumorphicCard } from '@/components/ui/NeumorphicCard';

import { OTPInput } from '@/components/ui/OTPInput';

import { membersApi, MemberRole } from '@/lib/members-api';

import { useMemberAuthStore } from '@/member/store/auth.store';

import { MemberSigninHelpModal } from '@/member/components/MemberSigninHelpModal';

import {

  memberPaths,

  MEMBER_ROLE_LABELS,

  MEMBER_APPROVER_LABEL,

  memberRecoveryStorageKey,

  memberAuthShellProps,

  memberPageTitle,

  persistMemberLastRole,

} from '@/member/lib/member-routes';

import { recordMemberLogin } from '@/member/lib/member-session';



type Phase = 'credentials' | 'fallback' | 'approval';



interface Props {

  role: MemberRole;

}



export function MemberSigninWizard({ role }: Props) {

  const router = useRouter();

  const paths = memberPaths(role);

  const shell = memberAuthShellProps(role);



  const setAuth = useMemberAuthStore((s) => s.setAuth);

  const [phase, setPhase] = useState<Phase>('credentials');

  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState('');

  const [password, setPassword] = useState('');

  const [sessionId, setSessionId] = useState('');

  const [totpCode, setTotpCode] = useState('');

  const [recoveryCode, setRecoveryCode] = useState('');

  const [approvalRequested, setApprovalRequested] = useState(false);

  const [fallbackMode, setFallbackMode] = useState<'totp' | 'recovery' | null>(null);

  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [allowFallbackFromFailure, setAllowFallbackFromFailure] = useState(false);



  useEffect(() => {

    persistMemberLastRole(role);

    document.title = memberPageTitle(role, 'Sign in');

  }, [role]);



  const finishLogin = (data: {

    accessToken: string;

    refreshToken: string;

    memberId: string;

    email: string;

    fullName: string;

    role: MemberRole;

    newRecoveryCode?: string;

    userId?: string;

  }) => {

    if (data.newRecoveryCode) {

      sessionStorage.setItem(memberRecoveryStorageKey(role), data.newRecoveryCode);

    }

    setAuth(

      {

        memberId: data.memberId,

        email: data.email,

        fullName: data.fullName,

        role: data.role,

        userId: data.userId,

        mustChangePassword: false,

      },

      data.accessToken,

      data.refreshToken,

    );

    recordMemberLogin(data.email, data.role, data.userId, `${MEMBER_ROLE_LABELS[data.role]} sign-in`);

    neoToast.success('Signed in');

    router.replace(paths.dashboard);

  };



  const openApproval = () => {

    setPhase('approval');

    neoToast.info(`Contact your ${MEMBER_APPROVER_LABEL[role]} for approval`);

  };



  const openHelpModal = (withFallback: boolean) => {

    setAllowFallbackFromFailure(withFallback);

    setHelpModalOpen(true);

  };



  const resetToCredentials = () => {

    setPhase('credentials');

    setFallbackMode(null);

    setTotpCode('');

    setRecoveryCode('');

    setApprovalRequested(false);

    setSessionId('');

  };



  const startFallback = (mode: 'totp' | 'recovery') => {

    setHelpModalOpen(false);

    setFallbackMode(mode);

    setPhase('fallback');

    setTotpCode('');

    setRecoveryCode('');

  };



  const goToForgotPassword = () => {

    setHelpModalOpen(false);

    const q = identifier.trim() ? `?identifier=${encodeURIComponent(identifier.trim())}` : '';

    router.push(`${paths.forgotPassword}${q}`);

  };



  const titles: Record<Phase, { title: string; subtitle: string }> = {

    credentials: {

      title: `${MEMBER_ROLE_LABELS[role]} sign in`,

      subtitle: 'Email, User ID, or phone number with password',

    },

    fallback: {

      title: fallbackMode === 'totp' ? 'Google Authenticator' : 'Recovery code',

      subtitle: 'Enter your fallback credentials to sign in',

    },

    approval: {

      title: 'Request help',

      subtitle: `Your ${MEMBER_APPROVER_LABEL[role]} can approve your sign-in`,

    },

  };



  return (

    <>

      <MemberSigninHelpModal

        open={helpModalOpen}

        onClose={() => setHelpModalOpen(false)}

        allowFallback={allowFallbackFromFailure}

        onForgotPassword={goToForgotPassword}

        onFallbackTotp={() => startFallback('totp')}

        onFallbackRecovery={() => startFallback('recovery')}

      />



      <StepLayout

        mode="signin"

        currentStep={1}

        totalSteps={3}

        portalTitle={shell.portalTitle}

        tagline={shell.tagline}

        footerLink={shell.footerLink}

        title={titles[phase].title}

        subtitle={titles[phase].subtitle}

        footer={

          phase === 'credentials' ? (

            <NeumorphicButton

              variant="primary"

              loading={loading}

              disabled={!identifier.trim() || !password}

              onClick={async () => {

                setLoading(true);

                try {

                  const { data } = await membersApi.primarySignin(identifier.trim(), password, role);

                  if (!data.passwordMatched) {

                    setSessionId(data.sessionId);

                    openHelpModal(true);

                    return;

                  }

                  if (data.requiresOnboarding) {

                    router.replace(`${paths.onboarding}?sessionId=${data.sessionId}`);

                    return;

                  }

                  if (data.accessToken) finishLogin(data);

                } catch (e: unknown) {

                  const status = (e as { response?: { status?: number } })?.response?.status;

                  if (status === 401) {

                    setSessionId('');

                    openHelpModal(false);

                  } else {

                    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data

                      ?.message;

                    neoToast.error(msg || 'Sign in failed');

                  }

                } finally {

                  setLoading(false);

                }

              }}

            >

              Sign in

            </NeumorphicButton>

          ) : phase === 'fallback' ? (

            <NeumorphicButton

              variant="primary"

              loading={loading}

              disabled={

                fallbackMode === 'totp' ? totpCode.length !== 6 : fallbackMode === 'recovery' ? !recoveryCode : true

              }

              onClick={async () => {

                if (!sessionId || !fallbackMode) return;

                setLoading(true);

                try {

                  if (fallbackMode === 'totp') {

                    const { data } = await membersApi.totpSignin(sessionId, totpCode);

                    if (data.accessToken) finishLogin(data);

                    else if (data.openApproval) openApproval();

                    else neoToast.error('Invalid authenticator code');

                  } else {

                    const { data } = await membersApi.recoverySignin(sessionId, recoveryCode);

                    if (data.matched && data.accessToken) finishLogin(data);

                    else if (data.openApproval) openApproval();

                    else neoToast.error('Invalid recovery code');

                  }

                } catch {

                  neoToast.error('Verification failed');

                } finally {

                  setLoading(false);

                }

              }}

            >

              Verify

            </NeumorphicButton>

          ) : (

            <>

              {!approvalRequested && (

                <NeumorphicButton

                  variant="primary"

                  loading={loading}

                  onClick={async () => {

                    setLoading(true);

                    try {

                      await membersApi.requestApproval(sessionId);

                      setApprovalRequested(true);

                      neoToast.info(`Request sent to ${MEMBER_APPROVER_LABEL[role]}`);

                    } catch {

                      neoToast.error('Request failed');

                    } finally {

                      setLoading(false);

                    }

                  }}

                >

                  Send approval request

                </NeumorphicButton>

              )}

              <NeumorphicButton

                loading={loading}

                onClick={async () => {

                  setLoading(true);

                  try {

                    const { data } = await membersApi.checkApproval(sessionId);

                    if (data.accessToken) finishLogin(data);

                    else neoToast.info('Still waiting for approval');

                  } catch {

                    neoToast.error('Check failed');

                  } finally {

                    setLoading(false);

                  }

                }}

              >

                Check status

              </NeumorphicButton>

            </>

          )

        }

      >

        {phase === 'credentials' && (

          <>

            <NeumorphicInput

              label="Email / User ID / Phone"

              value={identifier}

              onChange={(e) => setIdentifier(e.target.value)}

              autoComplete="username"

            />

            <NeumorphicInput

              label="Password"

              type="password"

              value={password}

              onChange={(e) => setPassword(e.target.value)}

            />

            <button

              type="button"

              className="text-left text-sm text-[var(--neo-primary)] underline"

              onClick={() => openHelpModal(false)}

            >

              Trouble signing in?

            </button>

          </>

        )}



        {phase === 'fallback' && (

          <>

            <NeumorphicCard className="!p-4 text-sm text-[var(--neo-muted)]">

              {fallbackMode === 'totp'

                ? 'Enter the 6-digit code from Google Authenticator.'

                : 'Enter the recovery code you saved during onboarding.'}

            </NeumorphicCard>

            {fallbackMode === 'totp' && (

              <OTPInput value={totpCode} onChange={setTotpCode} label="Authenticator code" />

            )}

            {fallbackMode === 'recovery' && (

              <NeumorphicInput

                label="Recovery code"

                value={recoveryCode}

                onChange={(e) => setRecoveryCode(e.target.value)}

              />

            )}

            <div className="flex flex-wrap gap-2">

              <NeumorphicButton

                onClick={() => {

                  setFallbackMode(fallbackMode === 'totp' ? 'recovery' : 'totp');

                  setTotpCode('');

                  setRecoveryCode('');

                }}

              >

                Switch to {fallbackMode === 'totp' ? 'recovery code' : 'Google Authenticator'}

              </NeumorphicButton>

              <NeumorphicButton onClick={() => openHelpModal(Boolean(sessionId))}>

                Other options

              </NeumorphicButton>

              <NeumorphicButton onClick={resetToCredentials}>Back to sign in</NeumorphicButton>

            </div>

          </>

        )}



        {phase === 'approval' && (

          <>

            <NeumorphicCard className="!p-4 text-sm">

              {approvalRequested ? (

                <p>Waiting for {MEMBER_APPROVER_LABEL[role]} to approve your access.</p>

              ) : (

                <p>Fallback methods did not work. Request approval from your {MEMBER_APPROVER_LABEL[role]}.</p>

              )}

            </NeumorphicCard>

            <NeumorphicButton onClick={() => setPhase('fallback')}>Back to fallback options</NeumorphicButton>

          </>

        )}

      </StepLayout>

    </>

  );

}


