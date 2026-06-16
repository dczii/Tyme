<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />

# ⏳ Tyme

A professional, SaaS-style time-tracking application inspired by Clockify. Built with high-performance real-time data sync, rich interactive reports, and beautiful aesthetic designs.

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=flat&logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind_css&logoColor=white)](https://tailwindcss.com/)

[**View App in Google AI Studio**](https://ai.studio/apps/2f5fed5d-b280-4d1c-aa74-fc396cd58da3)
</div>

---

## 🚀 Key Features

- **📅 Interactive Weekly Calendar**: Create, update, or remove entries visually. Modify entry durations using flexible hours and minutes fields (e.g. `0:15`, `1:30`).
- **📊 Advanced Reports & Metrics**: Filter time entries by project, specific tags, search queries, or predefined/custom date ranges. Get aggregate insights and target comparisons.
- **📄 Export to PDF**: Download elegant and structured PDF summaries of your tracked work built using `jsPDF`.
- **🔌 Google Contacts Integration**: Connect your account using Google OAuth to automatically synchronize client references from Google People API into your settings.
- **⚙️ Customization**: Configure your daily workday target hours and choose between three custom branding logo styles (*Classic*, *Minimalist*, and *Hourglass*).
- **🔒 Secure Sync**: Instant, real-time database synchronization via Cloud Firestore with strict access control and identity validation.

---

## 🛠️ Technology Stack

- **Core Framework**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/) (fast HMR, lightweight builder)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern CSS utility layout)
- **Backend / Sync**: [Firebase SDK v12](https://firebase.google.com/) (Auth, Firestore DB)
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
│   │   └── firebase.ts           # Firestore schema queries, security logging & People API contact fetch
│   ├── App.tsx                   # Central router & state container
│   ├── index.css                 # Global theme variables, animations & fonts
│   ├── initialData.ts            # Seeding data for new workspaces
│   ├── types.ts                  # TypeScript definitions for Projects, Tags, and Entries
│   └── utils.ts                  # Date formatting, math, and duration helpers
├── firestore.rules               # Strict Firestore database security rules
├── security_spec.md              # Documentation of workspace security invariants
├── firebase-applet-config.json   # Configured Firebase web credentials
└── package.json                  # Dependencies and execution scripts
```

---

## ⚙️ Environment Configuration

### Prerequisites
- **Node.js** (v18+)
- **NPM**

### Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory to specify local keys. See `.env.example` for details:

```bash
# Required for Gemini AI API calls (automatically injected in AI Studio)
GEMINI_API_KEY="your_api_key_here"

# The applet URL (automatically set during deployment)
APP_URL="your_applet_url_here"
```

### Firebase Web Config (`firebase-applet-config.json`)
The application requires the standard web configuration object to authenticate client calls. This is initialized under:
```json
{
  "projectId": "...",
  "appId": "...",
  "apiKey": "...",
  "authDomain": "...",
  "storageBucket": "...",
  "messagingSenderId": "..."
}
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
