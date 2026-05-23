import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin · NeuroLXP',
  description: 'Super Admin sign in, sign up, and account recovery',
};

export default function SuperAdminAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
