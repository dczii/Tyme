import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { TymeProvider } from './providers';
import './globals.css';

// SEO / GEO base URL. Replace https://tyme.app with your real production domain
// (this one constant feeds the canonical, Open Graph, and JSON-LD URLs).
const SITE_URL = 'https://tyme.app';

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

// Structured data for search engines and AI answer engines (GEO):
// describes the product, the brand, and answers common "time tracking" questions.
// Note: for Google FAQ rich results, mirror these Q&As in a visible FAQ section
// on a public landing page.
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tyme',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Time Tracking',
    operatingSystem: 'Web browser',
    url: `${SITE_URL}/`,
    description:
      'Tyme is a time tracking web app for freelancers and virtual assistants. Log billable hours on a visual weekly calendar, organize work with projects and tags, analyze filterable reports, and export branded PDF and CSV summaries.',
    audience: {
      '@type': 'Audience',
      audienceType: 'Freelancers and Virtual Assistants',
    },
    featureList: [
      'Interactive weekly calendar for logging and editing time entries',
      'Projects and tags to organize billable work by client',
      'Reports filterable by project, tag, search query, and date range',
      'Branded PDF export and CSV export of tracked time',
      'Configurable workday target hours and hourly billing rate',
      'Google Contacts (People API) integration via Google OAuth',
      'Real-time sync via Supabase with Row Level Security',
    ],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tyme',
    url: `${SITE_URL}/`,
    description: 'Free time tracking web app for freelancers and virtual assistants.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is time tracking?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Time tracking is the practice of recording exactly how long you spend on tasks, clients, and projects, usually with a web app. For freelancers and virtual assistants it is how you bill accurately, prove your hours, and identify unprofitable work.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the best time tracking app for freelancers and virtual assistants?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tyme is a strong free option built specifically for freelancers and virtual assistants. It centers on a visual weekly calendar, supports projects and tags, generates filterable reports, and exports branded PDF summaries for invoicing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is time tracking worth it if I charge flat fees instead of hourly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Tracking time against a fixed price reveals your true effective hourly rate, so you can price the next project more intelligently. You do not have to bill the hours, you just need to know them.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do virtual assistants track time across multiple clients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use projects to separate clients and tags to categorize recurring work types such as admin, meetings, and revisions. Tyme also syncs client references from Google Contacts via the People API, then lets you filter reports by client and export a PDF at invoice time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export time tracking reports to send to clients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Tyme builds structured, branded PDF summaries with jsPDF that you can attach directly to an invoice, and also supports CSV export for spreadsheets.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is my time tracking data secure in Tyme?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Tyme runs on Supabase PostgreSQL with Row Level Security policies that isolate each user's data at the database level, and authenticates with Google OAuth rather than home-rolled passwords.",
        },
      },
    ],
  },
];

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
