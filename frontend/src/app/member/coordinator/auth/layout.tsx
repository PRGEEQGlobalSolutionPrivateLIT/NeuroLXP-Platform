import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coordinator Portal · NeuroLXP',
  description: 'Coordinator sign in, onboarding, and account recovery',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
