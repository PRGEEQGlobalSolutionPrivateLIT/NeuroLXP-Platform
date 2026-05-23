import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Admin · NeuroLXP',
  description: 'Platform Admin sign in, sign up, and onboarding',
};

export default function PlatformAdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
