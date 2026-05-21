import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Portal · NeuroLXP',
  description: 'Student sign in, onboarding, and account recovery',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
