import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institution Admin · NeuroLXP',
  description: 'Institution Admin sign in and onboarding',
};

export default function InstitutionAdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
