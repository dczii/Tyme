<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# ⏳ Tyme

A professional, SaaS-style time-tracking application inspired by Clockify. Built with high-performance real-time data sync, rich interactive reports, and beautiful aesthetic designs.

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
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

- **Core Framework**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/) (fast HMR, lightweight builder)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern CSS utility layout)
- **Backend / Sync**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime)
- **Animations**: [Framer Motion (`motion`)](https://www.framer.com/motion/) (smooth transitions)
- **Toasts**: [Sonner](https://sonner.dev/) (rich toast alerts)
- **PDF Engine**: [jsPDF](https://github.com/parallax/jsPDF)

---

## 📂 Project Structure

```text
Tyme/
├── src/
│   ├── components/
│   │   ├── BrandLogo.tsx         # Logo rendering for Classic, Minimalist, Hourglass styles
│   │   ├── CalendarView.tsx      # Time entry logger, weekly calendar timeline & forms
│   │   ├── GoogleLoginPopup.tsx  # Google Login UI & scopes consent info
│   │   ├── LoginScreen.tsx       # Auth gate and introduction page
│   │   ├── ReportsView.tsx       # Search filter metrics, chart aggregates & PDF export
│   │   ├── SettingsView.tsx      # Workday goals, active projects, tags & Google Contacts
│   │   └── Sidebar.tsx           # Premium navigation sidebar & branding selections
│   ├── lib/
│   │   └── supabase.ts           # Supabase client, auth, realtime subscriptions & People API contact fetch
│   ├── App.tsx                   # Central router & state container
│   ├── index.css                 # Global theme variables, animations & fonts
│   ├── types.ts                  # TypeScript definitions for Projects, Tags, and Entries
│   └── utils.ts                  # Date formatting, math, and duration helpers
├── scripts/
│   └── migrate-firebase-to-supabase.ts  # One-time data migration script
├── security_spec.md              # Documentation of workspace security invariants
└── package.json                  # Dependencies and execution scripts
```

---

## ⚙️ Environment Configuration

### Prerequisites
- **Node.js** (v18+)
- **NPM**

### Environment Variables (`.env`)
Create a `.env` file in the root directory. See `.env.example` for details:

```bash
# Required for Gemini AI API calls
GEMINI_API_KEY="your_api_key_here"

# Supabase configuration (get from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
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
Compiles and builds the production-ready assets into the `dist/` directory.

### Preview
```bash
npm run preview
```
Statically previews the local production build in `dist/` to verify performance and visual behavior before deployment.

### Type Check & Lint
```bash
npm run lint
```
Runs the TypeScript compiler (`tsc --noEmit`) to verify types and catch potential runtime issues without creating output files.

### Clean Workspace
```bash
npm run clean
```
Removes generated assets and compiled files (`dist/`, `server.js`) to ensure a fresh build.

---

## 🔄 Data Migration (Firebase → Supabase)

If you have existing data in Firestore that needs to be migrated:

### Prerequisites
1. Install `firebase-admin` temporarily:
   ```bash
   npm install firebase-admin
   ```
2. Download your Firebase service account key from **Firebase Console → Project Settings → Service Accounts → Generate New Private Key** and save as `scripts/firebase-service-account.json`
3. Set your Supabase **service role key** (not anon key):
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

### Run Migration
```bash
# Dry run (preview what will be migrated, no data written)
npx tsx scripts/migrate-firebase-to-supabase.ts

# Execute migration
npx tsx scripts/migrate-firebase-to-supabase.ts --execute
```

### Cleanup
```bash
npm uninstall firebase-admin
rm scripts/firebase-service-account.json
```
