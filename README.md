<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# ⏳ Tyme

A professional, SaaS-style time-tracking application inspired by Clockify. Built with high-performance real-time data sync, rich interactive reports, and beautiful aesthetic designs.

[![Next.js](https://img.shields.io/badge/next.js-%23000000.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/supabase-%2300C389.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind_css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Key Features

- **📅 Interactive Weekly Calendar**: Create, update, or remove entries visually. Modify entry durations using flexible hours and minutes fields (e.g. `0:15`, `1:30`).
- **📊 Advanced Reports & Metrics**: Filter time entries by project, specific tags, search queries, or predefined/custom date ranges. Get aggregate insights and target comparisons.
- **📄 Export to PDF**: Download elegant and structured PDF summaries of your tracked work built using `jsPDF`.
- **🔌 Google Contacts Integration**: Connect your account using Google OAuth to automatically synchronize client references from Google People API into your settings.
- **⚙️ Customization**: Configure your daily workday target hours and choose between three custom branding logo styles (*Classic*, *Minimalist*, and *Hourglass*).
- **🔒 Secure Sync**: Instant, real-time database synchronization via Supabase PostgreSQL with Row Level Security (RLS) policies.
- **🆕 Fresh Workspace**: Starts completely clean without pre-populated mock projects, tags, or time entries, enabling immediate production tracking.

---

## 🛠️ Technology Stack

- **Core Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/postcss`)
- **Backend / Sync**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime)
- **Animations**: [Framer Motion (`motion`)](https://www.framer.com/motion/) (smooth transitions)
- **Toasts**: [Sonner](https://sonner.dev/) (rich toast alerts)
- **PDF Engine**: [jsPDF](https://github.com/parallax/jsPDF)

---

## 📂 Project Structure

```text
Tyme/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout: <html>/<body>, Analytics, TymeProvider
│   │   ├── page.tsx                  # Redirects "/" → "/calendar"
│   │   ├── providers.tsx             # Client Context: session, synced data & CRUD handlers
│   │   ├── globals.css               # Global theme variables, animations & fonts
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.tsx            # Auth gate, sidebar & background shell
│   │       ├── calendar/page.tsx     # Calendar route
│   │       ├── reports/page.tsx      # Reports route
│   │       └── settings/page.tsx     # Settings route
│   ├── components/
│   │   ├── BrandLogo.tsx         # Logo rendering for Classic, Minimalist, Hourglass styles
│   │   ├── CalendarView.tsx      # Time entry logger, weekly calendar timeline & forms
│   │   ├── LoginScreen.tsx       # Auth gate and introduction page
│   │   ├── ReportsView.tsx       # Search filter metrics, chart aggregates & PDF export
│   │   ├── SettingsView.tsx      # Workday goals, active projects, tags & Google Contacts
│   │   └── Sidebar.tsx           # Premium navigation sidebar & branding selections
│   ├── lib/
│   │   └── supabase.ts           # Supabase client, auth, realtime subscriptions & People API contact fetch
│   ├── types.ts                  # TypeScript definitions for Projects, Tags, and Entries
│   └── utils.ts                  # Date formatting, math, and duration helpers
├── next.config.ts                # Next.js configuration & security headers
├── postcss.config.mjs            # Tailwind v4 via @tailwindcss/postcss
├── security_spec.md              # Documentation of workspace security invariants
└── package.json                  # Dependencies and execution scripts
```

---

## ⚙️ Environment Configuration

### Prerequisites
- **Node.js** (v18.18+, v20+ recommended — required by Next.js 15)
- **NPM**

### Environment Variables (`.env`)
Create a `.env` file in the root directory. See `.env.example` for details:

```bash
# Supabase configuration (get from Supabase Dashboard → Settings → API)
# The NEXT_PUBLIC_ prefix exposes these to the browser for the client SDK.
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 💻 Available Scripts

Run the following commands in the root of the project:

### Development
```bash
npm run dev
```
Starts the local development server on port **3000** with host **0.0.0.0** enabled. Access it locally via `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `.next/` directory.

### Production Server
```bash
npm run start
```
Serves the production build on port **3000**. Run `npm run build` first.

### Type Check & Lint
```bash
npm run lint
```
Runs the TypeScript compiler (`tsc --noEmit`) to verify types and catch potential runtime issues without creating output files.

### Clean Workspace
```bash
npm run clean
```
Removes generated build output (`.next/`, `dist/`) to ensure a fresh build.

---

## ▲ Deployment

The app is a standard Next.js App Router project and deploys to [Vercel](https://vercel.com/) with zero configuration (it already ships `@vercel/analytics`):

1. Import the repository into Vercel.
2. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in **Project Settings → Environment Variables**.
3. In the Supabase Dashboard, add your deployment URL to **Authentication → URL Configuration** so the Google OAuth redirect resolves correctly.
4. **Required:** enable Row Level Security with owner-only policies on the `profiles`, `projects`, `tags`, and `entries` tables in the Supabase Dashboard. The required policies and data invariants are documented in [`security_spec.md`](./security_spec.md). Without RLS, anyone holding the public anon key can read and write every user's rows.

Vercel runs `npm run build` and serves the output automatically. Any Node.js host that supports `next build` / `next start` works as well.

### 🔐 Security

The browser talks to Supabase directly with the public anon key, so all access
control lives in the database: owner-only RLS policies plus CHECK-constraint
data invariants, applied via the Supabase Dashboard SQL Editor. The invariants,
policy SQL, and attack payload test matrix are documented in
[`security_spec.md`](./security_spec.md). The app also ships hardened HTTP
security headers (CSP, HSTS, `frame-ancestors 'none'`, etc.) via `next.config.ts`.
