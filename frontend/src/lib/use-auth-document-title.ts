'use client';

import { useEffect } from 'react';
import { authPageTitle, type AuthPortalKey } from '@/lib/auth-portal-config';

export function useAuthDocumentTitle(portal: AuthPortalKey, page: string) {
  useEffect(() => {
    document.title = authPageTitle(portal, page);
  }, [portal, page]);
}
