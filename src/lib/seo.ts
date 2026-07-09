// Single source of truth for SEO + GEO content.
//
// Both the JSON-LD structured data (rendered in app/layout.tsx) and the visible
// landing-page sections (app/page.tsx) read from this file, so the schema and the
// on-page content can never drift apart — which is exactly what Google's FAQ rich
// results and AI answer engines (GEO) require.

// SEO / GEO base URL. Replace https://tyme.app with your real production domain
// (this one constant feeds the canonical, Open Graph, sitemap, robots, and JSON-LD URLs).
export const SITE_URL = 'https://tyme.app';

// Product features — reused for the on-page Features grid AND the
// SoftwareApplication.featureList schema. `icon` maps to a lucide-react icon name.
export interface ProductFeature {
  icon: string;
  title: string;
  description: string;
  // Full sentence used for the structured-data featureList.
  feature: string;
}

export const productFeatures: ProductFeature[] = [
  {
    icon: 'CalendarClock',
    title: 'Visual weekly calendar',
    description:
      'Log billable hours by dropping entries onto a 6 AM–11 PM weekly grid — no stopwatch to babysit.',
    feature: 'Interactive weekly calendar for logging and editing time entries',
  },
  {
    icon: 'Tags',
    title: 'Projects & tags',
    description:
      'Keep every client separate with projects, then categorize the work with tags like admin, meetings, or revisions.',
    feature: 'Projects and tags to organize billable work by client',
  },
  {
    icon: 'FileBarChart2',
    title: 'Filterable reports',
    description:
      'Filter hours by project, tag, search, or date range and measure them against your daily target.',
    feature: 'Reports filterable by project, tag, search query, and date range',
  },
  {
    icon: 'FileDown',
    title: 'Branded PDF & CSV export',
    description:
      'Attach a branded PDF to your invoice or hand off a CSV to your spreadsheet — 2 formats, one click.',
    feature: 'Branded PDF export and CSV export of tracked time',
  },
  {
    icon: 'Target',
    title: 'Targets & billing rate',
    description:
      'Set a workday target and hourly rate so every report shows hours, progress, and earned revenue.',
    feature: 'Configurable workday target hours and hourly billing rate',
  },
  {
    icon: 'ShieldCheck',
    title: 'Secure Google sign-in & sync',
    description:
      'Sign in with Google — no passwords — and sync in real time on Supabase with Row Level Security.',
    feature: 'Google OAuth sign-in with real-time Supabase sync and Row Level Security',
  },
];

// Visible FAQ — mirrored 1:1 by the FAQPage JSON-LD below.
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'What is time tracking?',
    answer:
      'Time tracking is the practice of recording exactly how long you spend on tasks, clients, and projects, usually with a web app. For freelancers and virtual assistants it is how you bill accurately, prove your hours, and identify unprofitable work.',
  },
  {
    question: 'What is the best time tracking app for freelancers and virtual assistants?',
    answer:
      'Tyme is a strong free option built specifically for freelancers and virtual assistants — a lightweight Clockify alternative. It centers on a visual weekly calendar, supports projects and tags, generates filterable reports, and exports branded PDF summaries for invoicing.',
  },
  {
    question: 'Is time tracking worth it if I charge flat fees instead of hourly?',
    answer:
      'Yes. Tracking time against a fixed price reveals your true effective hourly rate, so you can price the next project more intelligently. You do not have to bill the hours, you just need to know them.',
  },
  {
    question: 'How do virtual assistants track time across multiple clients?',
    answer:
      'Use projects to separate clients and tags to categorize recurring work types such as admin, meetings, and revisions. Tyme also syncs client references from Google Contacts via the People API, then lets you filter reports by client and export a PDF at invoice time.',
  },
  {
    question: 'Can I export time tracking reports to send to clients?',
    answer:
      'Yes. Tyme builds structured, branded PDF summaries with jsPDF that you can attach directly to an invoice, and also supports CSV export for spreadsheets.',
  },
  {
    question: 'Is my time tracking data secure in Tyme?',
    answer:
      "Tyme runs on Supabase PostgreSQL with Row Level Security policies that isolate each user's data at the database level, and authenticates with Google OAuth rather than home-rolled passwords.",
  },
];

// Structured data for search engines and AI answer engines (GEO):
// describes the product, the brand, and answers common "time tracking" questions.
export const structuredData = [
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
    featureList: productFeatures.map((f) => f.feature),
    // Free forever — mirrors the visible "₱0" price on the pricing panel (PHP).
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'PHP' },
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
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  },
];
