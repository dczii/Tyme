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
      'Log your hours by dropping entries onto a 6 AM–11 PM weekly grid — no stopwatch to babysit.',
    feature: 'Interactive weekly calendar for logging and editing time entries',
  },
  {
    icon: 'Tags',
    title: 'Projects & tags',
    description:
      'Keep every project separate, then categorize the work with tags like admin, meetings, study, or revisions.',
    feature: 'Projects and tags to organize your time by project and activity',
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
    title: 'PDF & CSV time logs',
    description:
      'Export a clean, shareable time log as a branded PDF, or hand off a CSV to your spreadsheet — 2 formats, one click.',
    feature: 'Branded PDF and CSV export of your tracked time as a shareable time log',
  },
  {
    icon: 'Target',
    title: 'Targets & optional billing rate',
    description:
      'Set a daily target to stay on pace — and add an hourly rate if you bill, so reports show hours, progress, and earnings.',
    feature: 'Configurable daily target hours and optional hourly billing rate',
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
      'Time tracking is the practice of recording exactly how long you spend on tasks, projects, and activities, usually with a web app. It helps anyone — professionals, teams, students, or people tracking personal productivity — see where their time actually goes, prove their hours, and keep an accurate time log.',
  },
  {
    question: 'How do I create a time log?',
    answer:
      'With Tyme you log your hours on a visual weekly calendar, organize them with projects and tags, then export a clean time log as a branded PDF or CSV in one click. No spreadsheets to maintain — the log is generated from the entries you already tracked.',
  },
  {
    question: 'What is the best free time tracking app?',
    answer:
      'Tyme is a strong free option for anyone who wants to track time and generate a time log — a lightweight Clockify alternative. It centers on a visual weekly calendar, supports projects and tags, generates filterable reports, and exports branded PDF and CSV time logs. Freelancers, consultants, employees, teams, and students all use it.',
  },
  {
    question: 'Who is Tyme for?',
    answer:
      'Anyone who wants to know where their time goes: freelancers and consultants billing clients, employees and teams filling out timesheets, students tracking study hours, and people measuring their own productivity. Billing features like an hourly rate are optional, so you can track time whether or not you invoice.',
  },
  {
    question: 'Can I export my time tracking data as a report or time log?',
    answer:
      'Yes. Tyme builds structured, branded PDF time logs with jsPDF that you can share, attach to an invoice, or keep for your records, and also supports CSV export for spreadsheets.',
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
      'Tyme is a free time tracking web app for anyone who wants to track their time and generate a time log. Log hours on a visual weekly calendar, organize work with projects and tags, analyze filterable reports, and export branded PDF and CSV time logs.',
    audience: {
      '@type': 'Audience',
      audienceType: 'Freelancers, consultants, employees, teams, students, and anyone who tracks their time',
    },
    featureList: productFeatures.map((f) => f.feature),
    // Free forever — mirrors the visible "$0" price on the pricing panel (USD).
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tyme',
    url: `${SITE_URL}/`,
    description: 'Free time tracking and time log web app for anyone who tracks their time.',
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
