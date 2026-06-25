import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { TymeProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tyme – SaaS Time Tracker & Reporting',
  icons: {
    icon: [{ url: '/favicon.svg?v=1', type: 'image/svg+xml' }],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0c0806] text-slate-200 font-sans antialiased">
        <TymeProvider>{children}</TymeProvider>
        <Analytics />
      </body>
    </html>
  );
}
