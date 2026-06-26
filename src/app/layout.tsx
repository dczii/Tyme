import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { TymeProvider } from './providers';
import { SITE_URL, structuredData } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Tyme — Time Tracking App for Freelancers & Virtual Assistants',
  description:
    'Tyme is a free time tracking web app for freelancers and virtual assistants. Log billable hours on a visual weekly calendar, filter reports by project and tag, and export branded PDF summaries.',
  applicationName: 'Tyme',
  authors: [{ name: 'Tyme' }],
  keywords: [
    'time tracking',
    'time tracking app',
    'time tracker',
    'freelancer time tracking',
    'virtual assistant time tracking',
    'billable hours',
    'timesheet',
    'weekly time log',
    'PDF time reports',
    'Clockify alternative',
  ],
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    siteName: 'Tyme',
    title: 'Tyme — Time Tracking App for Freelancers & Virtual Assistants',
    description:
      'Track billable hours on a visual weekly calendar, filter reports by project, tag and date, and export branded PDF summaries. Free time tracking built for freelancers and VAs.',
    url: '/',
    locale: 'en_US',
    images: [{ url: '/og-image.png', alt: 'Tyme time tracking app logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyme — Time Tracking App for Freelancers & Virtual Assistants',
    description:
      'Free time tracking for freelancers and virtual assistants. Visual weekly calendar, filterable reports, and branded PDF exports.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg?v=1', type: 'image/svg+xml' }],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c0806',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0c0806] text-slate-200 font-sans antialiased">
        <TymeProvider>{children}</TymeProvider>
        <Analytics />
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </body>
    </html>
  );
}
