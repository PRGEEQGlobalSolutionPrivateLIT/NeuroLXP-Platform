import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { DashboardThemeScript } from '@/components/dashboard/DashboardThemeScript';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NeuroLXP — Learning Experience Platform',
  description: 'AI-powered enterprise LMS/LXP platform',
  icons: {
    icon: '/neurolxp-logo.png',
    apple: '/neurolxp-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <DashboardThemeScript />
      </head>
      <body className="neo-page antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
