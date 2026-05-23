export type AuthPortalKey = 'superadmin' | 'platform-admin' | 'institution-admin';

export type AuthPageMode = 'signin' | 'signup' | 'onboarding';

export type AuthPortalConfig = {
  brand: string;
  portalTitle: string;
  signInTagline: string;
  signUpTagline: string;
  onboardingTagline: string;
  signInPath: string;
  signUpPath?: string;
};

export const AUTH_PORTAL_CONFIG: Record<AuthPortalKey, AuthPortalConfig> = {
  superadmin: {
    brand: 'NeuroLXP',
    portalTitle: 'Super Admin Portal',
    signInTagline: 'Secure super administrator access',
    signUpTagline: 'Secure super administrator registration',
    onboardingTagline: 'Complete your super administrator profile',
    signInPath: '/superadmin/auth/signin',
    signUpPath: '/superadmin/auth/signup',
  },
  'platform-admin': {
    brand: 'NeuroLXP',
    portalTitle: 'Platform Admin Portal',
    signInTagline: 'Secure platform administrator access',
    signUpTagline: 'Register as a platform administrator',
    onboardingTagline: 'Complete your platform administrator onboarding',
    signInPath: '/platform-admin/auth/signin',
    signUpPath: '/platform-admin/auth/signup',
  },
  'institution-admin': {
    brand: 'NeuroLXP',
    portalTitle: 'Institution Admin Portal',
    signInTagline: 'Secure institution administrator access',
    signUpTagline: 'Institution administrator registration',
    onboardingTagline: 'Complete your institution administrator onboarding',
    signInPath: '/institution-admin/auth/signin',
  },
};

export function authPageTitle(portal: AuthPortalKey, page: string) {
  return `${page} · ${AUTH_PORTAL_CONFIG[portal].portalTitle} · NeuroLXP`;
}

export function authPortalLayoutProps(portal: AuthPortalKey, mode: AuthPageMode) {
  const config = AUTH_PORTAL_CONFIG[portal];
  const tagline =
    mode === 'signin'
      ? config.signInTagline
      : mode === 'signup'
        ? config.signUpTagline
        : config.onboardingTagline;

  const footerLink =
    mode === 'signin' && config.signUpPath
      ? { href: config.signUpPath, label: 'Need an account? Register' }
      : mode === 'signup'
        ? { href: config.signInPath, label: 'Already have an account? Sign in' }
        : { href: config.signInPath, label: 'Back to sign in' };

  return {
    brand: config.brand,
    portalTitle: config.portalTitle,
    tagline,
    footerLink,
  };
}
