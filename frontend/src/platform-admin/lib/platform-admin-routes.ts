/** Public platform admin auth routes */
export const PLATFORM_ADMIN_SIGNIN_PATH = '/platform-admin/auth/signin';
export const PLATFORM_ADMIN_SIGNUP_PATH = '/platform-admin/auth/signup';

export function getPlatformAdminSignupUrl(origin?: string): string {
  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || '');
  return `${base.replace(/\/$/, '')}${PLATFORM_ADMIN_SIGNUP_PATH}`;
}
