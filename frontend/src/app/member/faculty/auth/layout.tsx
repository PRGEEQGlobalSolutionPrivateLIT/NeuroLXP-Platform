import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faculty Portal · NeuroLXP',
  description: 'Faculty sign in, onboarding, and account recovery',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
