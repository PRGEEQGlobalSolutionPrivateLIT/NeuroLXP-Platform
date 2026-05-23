'use client';

import { useEffect, useState } from 'react';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { getPlatformAdminSignupUrl } from '@/platform-admin/lib/platform-admin-routes';
import neoToast from '@/lib/toast';

export function PlatformAdminSignupLinkCard() {
  const [signupUrl, setSignupUrl] = useState('');

  useEffect(() => {
    setSignupUrl(getPlatformAdminSignupUrl());
  }, []);

  const copyLink = async () => {
    if (!signupUrl) return;
    try {
      await navigator.clipboard.writeText(signupUrl);
      neoToast.success('Platform admin signup link copied');
    } catch {
      neoToast.error('Could not copy link');
    }
  };

  return (
    <div className="mt-4 rounded-2xl neo-inset p-4 text-sm">
      <p className="font-semibold text-[var(--neo-text)]">Platform admin signup link</p>
      <p className="mt-1 text-[var(--neo-muted)]">
        Share this URL so new platform administrators can register themselves:
      </p>
      <code className="mt-2 block break-all rounded-xl bg-[var(--neo-surface)] px-3 py-2 text-xs font-medium text-[var(--neo-primary)]">
        {signupUrl || '…'}
      </code>
      <div className="mt-3">
        <NeumorphicButton type="button" onClick={copyLink} disabled={!signupUrl}>
          Copy signup link
        </NeumorphicButton>
      </div>
    </div>
  );
}
