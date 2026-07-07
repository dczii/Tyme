---
name: tyme-architecture
description: The master map of the Tyme codebase — routes, data flow, the TymeProvider context, the project/tag/entry model, and project history. Read this FIRST when starting any task in this repo, when asking "where does X live", "how does data flow", or before touching providers.tsx, the route structure, or anything that crosses more than one file.
---

# Tyme Architecture

Tyme is a SaaS-style time-tracking app (Clockify-inspired) for freelancers/VAs.
**Stack:** Next.js 15 App Router + React 19 + TypeScript (strict) + Tailwind CSS v4 + Supabase (auth, Postgres, realtime) + GSAP/Lenis (landing) + motion/Framer (app micro-interactions) + jsPDF + sonner + lucide-react.

Everything meaningful is client-rendered. There is **no API route, no middleware, no server action** — the browser talks straight to Supabase with the anon key, and Row Level Security is the entire authorization model. `next.config.ts` adds a strict CSP + security-header set on every response (see tyme-conventions).

## History you need to know (explains the weirdness)

1. Born as a **Vite/React Router SPA scaffolded by Google AI Studio** (hence `metadata.json`, the stale `dist/` Vite build, the unused `GEMINI_API_KEY` in `.env`, and `"name": "react-example"` in package.json).
2. **Firebase → Supabase migration** (v2.x): data-layer function names still say `saveEntryToFS`, `deleteTagFromFS` — "FS" = Firestore. They write to Supabase now. Do not "fix" the names casually; they're referenced everywhere.
3. **Vite → Next.js 15 App Router migration** (PR #9). The SPA's page-switch state became real routes.
4. **Single-project era ended at v2.3.2**: until then the workspace was locked to one project ("Singular Alignment"). PR #10 added full multi-project support. Old commits, copy, and comments referencing "the singular project" predate this.
5. **Security hardening pass (v2.3.2)**: `security_spec.md` was rewritten as the authoritative RLS + CHECK-constraint spec (with reference SQL), CSP headers landed in next.config.ts, ids moved to `crypto.randomUUID()`, and the Firebase migration script was deleted (recover from git history at tag-commit `de7d2d7~1` if ever needed).

## Route map

| Route | File | What it is |
|---|---|---|
| `/` | [src/app/page.tsx](src/app/page.tsx) | Public marketing landing (server component + client animation islands) |
| `/login` | [src/app/login/page.tsx](src/app/login/page.tsx) | Public auth page; redirects to `/calendar` if already signed in |
| `/calendar` | [src/app/(app)/calendar/page.tsx](src/app/(app)/calendar/page.tsx) | Weekly calendar + live timer (the core screen) |
| `/reports` | [src/app/(app)/reports/page.tsx](src/app/(app)/reports/page.tsx) | Filterable reports, CSV + PDF export |
| `/settings` | [src/app/(app)/settings/page.tsx](src/app/(app)/settings/page.tsx) | Project identity, hourly rate, workday target, sign-out |

- The `(app)` route group's [layout.tsx](src/app/(app)/layout.tsx) is the **auth gate**: shows a loading curtain while `authLoading`, renders `<LoginScreen>` if no user, otherwise Sidebar + page. It derives the active nav item from `usePathname()`.
- Root [layout.tsx](src/app/layout.tsx) loads fonts (next/font: Geist=display, Inter=body, JetBrains Mono=mono), mounts `<TymeProvider>`, Vercel `<Analytics>`, and JSON-LD `<script>` tags from `src/lib/seo.ts`.
- The page components under `(app)/` are thin wrappers: they pull from `useTyme()` and pass props down to the big view components in `src/components/`.

## Data flow (the one diagram that matters)

```
Supabase (Postgres + Realtime + Auth)
        ▲            │ postgres_changes → refetch full table
        │ upsert/    ▼
   src/lib/supabase.ts   (all DB + auth functions live here, nowhere else)
        ▲            │
        │ handlers   ▼ subscriptions set React state
   src/app/providers.tsx — TymeProvider (React context, client-only)
        │
        ▼ useTyme()
   (app)/*/page.tsx → CalendarView / ReportsView / SettingsView / Sidebar
```

- **`TymeProvider`** ([providers.tsx](src/app/providers.tsx)) owns ALL synced state: `user`, `projects`, `tags`, `entries`, `contacts`, plus settings (`logoStyle`, `workdayTargetHours`, `hourlyRate`). Components never call Supabase directly — they call the `handle*`/`save*` functions from context.
- Writes are **optimistic-by-realtime**: a handler upserts to Supabase, the `postgres_changes` event fires, the subscription re-fetches the whole table, React state updates. There is no local optimistic mutation — UI updates arrive via the realtime round-trip.
- `useTyme()` throws if used outside the provider — that's your hint a component was mounted outside the tree.

## Projects model (multi-project since v2.3.2)

Full project CRUD lives in providers.tsx: `handleAddProject` (returns the new Project synchronously, persists async), `handleUpdateProject(id, partial)`, and `handleDeleteProject(id)` — the latter **unassigns referencing entries first** (sequential rewrites) then deletes the project. UI surfaces: a project manager in SettingsView, and live project pickers in the calendar timer bar and the Add-Entry modal (both with inline create forms). The shared preset palette is `PROJECT_COLORS` in [src/constants.ts](src/constants.ts) — use it, don't inline hexes.

Entries may reference `projectId: undefined` ("No Project"); reports group those under "unassigned". Per-project hourly rates do NOT exist — one flat rate for everything.

## Types (src/types.ts — tiny, memorize it)

`Project {id,name,client?,color}` · `Tag {id,name}` · `TimeEntry {id,description,projectId?,tags:string[],date:'YYYY-MM-DD',startTime:'HH:MM',endTime:'HH:MM',durationMinutes}` · `ReportFilter` · `UserProfile {email,name,picture,hourlyRate?}`

**Entries store tag NAMES, not tag ids.** Deleting a tag makes `handleDeleteTag` sweep every entry and rewrite it without that name (sequential awaits — slow with many entries). IDs are client-generated via `newId(prefix)` = `` `${prefix}-${crypto.randomUUID()}` `` in providers.tsx (Date.now/Math.random ids were replaced as guessable; old rows keep their legacy ids).

## Directory cheat-sheet

- `src/lib/supabase.ts` — the entire data layer (see **tyme-data-layer** skill)
- `src/lib/seo.ts` — single source of truth for features/FAQ/JSON-LD (see **tyme-seo** skill)
- `src/utils.ts` — date/duration math + CSV export (with formula-injection neutralization). `getMonday`, `getWeekDays`, `formatDateYYYYMMDD`, `calculateDurationMinutes` (handles overnight by +24h), `getPresetDateRange`
- `src/constants.ts` — `PROJECT_COLORS` preset palette
- `src/components/` — CalendarView, ReportsView, SettingsView, Sidebar, LoginScreen + `BrandLogo` + `HourlyRateControl`
- `src/components/landing/` — intro splash, Reveal, CTA buttons; `landing/scroll/` = GSAP scenes (see **tyme-landing-animations** skill)
- `security_spec.md` — authoritative RLS/CHECK-constraint spec + reference SQL (rewritten v2.3.2)
- `dist/`, `faq-card-demo.html`, `metadata.json`, `.antigravity/` — legacy/scratch artifacts, not part of the app

## Related skills

`tyme-data-layer` (Supabase/auth/schema) · `tyme-conventions` (workflows, styling, version ritual) · `tyme-calendar` (CalendarView internals) · `tyme-reports-pdf` (reports + jsPDF) · `tyme-landing-animations` (GSAP/Lenis landing) · `tyme-seo` (metadata/JSON-LD) · `tyme-gotchas` (known bugs & dead code)
