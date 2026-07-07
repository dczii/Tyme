---
name: tyme-conventions
description: Day-to-day workflows and house style for the Tyme repo — dev server, typecheck, the version-bump commit ritual, deployment to Vercel, the espresso design system (colors, fonts, glassmorphism), toasts, and icons. Use when running/building/committing/deploying, styling any UI, or asking "how do I check my work" / "what color/font do I use" in this repo.
---

# Tyme Conventions & Workflows

## Commands

| Task | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Next dev on `0.0.0.0:3000`. Prefer the `dev` config in `.claude/launch.json` (preview tools) |
| Typecheck ("lint") | `npm run lint` | It's `tsc --noEmit` — there is **no ESLint config**. This is the only check; there are **no tests** in the repo |
| Prod build | `npm run build` | ⚠️ **NEVER run while a dev server is running** — both write `.next/` and the dev server starts 500ing. Use `npm run lint` to validate instead |
| Clean | `npm run clean` | Removes `.next/` and `dist/` |

TypeScript is `strict: true`, path alias `@/* → ./src/*`, `scripts/` excluded from typecheck.

## The version-bump commit ritual

`package.json` `version` is **displayed live in the app** (Sidebar footer, `v{packageJson.version}` — [Sidebar.tsx:320](src/components/Sidebar.tsx)). House rule visible in every commit in the log:

1. Bump the patch (or minor for features) version in package.json as part of your change.
2. Commit message: imperative summary + `, bump version to X.Y.Z` — e.g. `Trim PDF report: drop redundant ledger + percentage column, MM/DD chart dates, bump to 2.3.1`.

Single `main` branch on `github.com/dczii/Tyme`; occasional feature branches merged via PR (`nextjs-migration`).

## Deployment

Vercel, zero-config. Two env vars in Project Settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **After adding a deployment URL, register it (and `{url}/calendar`) in Supabase Auth → URL Configuration → Redirect URLs** or Google login breaks on that deployment. `@vercel/analytics` is already mounted in the root layout.

**Security headers live in [next.config.ts](next.config.ts)**: a strict CSP (script-src allows self + Vercel Analytics only, `'unsafe-eval'` dev-only for Fast Refresh; connect-src allows Supabase + People API + Analytics only), plus HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, `poweredByHeader: false`. **Adding any third-party script, font host, or API endpoint requires updating the CSP allowlist** — otherwise it works in dev tooling and silently breaks in production. `package.json` pins `postcss ^8.5.10` via `overrides` (security floor); keep it when touching deps.

## Design system — "Espresso" dark theme

Dark-only (`theme` is hardcoded `'dark'` in providers; the theme toggle prop on Sidebar is a no-op). All colors are **inline Tailwind arbitrary values** — there is no token file; match these exact hexes:

| Role | Hex |
|---|---|
| Page background | `#0c0806` |
| Panel/card surfaces | `#140d0a`, `#130d0a`, `#1c120c`, `#1d1410` (input fill) |
| Borders | `#3e271a` (primary), `#3d2416`, `#2a1b12`, `#321c11` |
| Accent tan (highlights, icons, mono numerals) | `#dda67a` |
| Accent copper (primary buttons) | `#a66e46`, hover `#8e5a34` |
| Body text cream | `#ecd0b9` at /50–/85 opacities; white for headings |
| Logo orange | `#E8651A` on `#1A0F0A` |
| Danger / stop-timer | rose/red-500 family; success emerald |

House styling patterns:
- **Glassmorphism**: translucent panel + `backdrop-blur-xl` + hairline border, e.g. `bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl`.
- Ambient background glow: absolutely-positioned blurred color blobs (`blur-[100px]`+`animate-pulse`), always `pointer-events-none`, `aria-hidden` on landing.
- Radii are generous: `rounded-xl`/`rounded-2xl`/`rounded-3xl`. Buttons get `cursor-pointer` explicitly.
- Every interactive element has visible hover state; small labels are uppercase mono with `tracking-wider`.

## Typography (Tailwind v4 `@theme` in globals.css)

Self-hosted via next/font in [layout.tsx](src/app/layout.tsx) — never add a Google Fonts `<link>`:
- `font-sans` → Inter (body)
- `font-display` → Geist (headings; `h1–h4` get it automatically via globals.css)
- `font-mono` → JetBrains Mono (ALL numerals, durations, timers, tiny uppercase labels)

Tailwind v4 = CSS-first config (`@import "tailwindcss"` + `@theme` block). **There is no tailwind.config.js** — custom animations/keyframes go in the `@theme` block in [globals.css](src/app/globals.css). PostCSS via `@tailwindcss/postcss`.

Mobile helpers in globals.css: `.pb-safe` (safe-area inset), bottom padding on `#app-root-container > main` under 768px so the fixed bottom nav doesn't cover content, scrollbars hidden on touch devices, print styles force white background.

## UI libraries

- **Icons:** lucide-react only.
- **Toasts:** sonner — `<Toaster position="bottom-right" theme="dark" richColors />` is mounted once in `(app)/layout.tsx`. Pattern: `toast.success('Title', { description, duration })`; use toasts for every persistence success/failure.
- **App micro-interactions:** `motion/react` (Framer) — `AnimatePresence` + `motion.div` for modals (spring `damping:25, stiffness:350`), `layoutId` for the sidebar/bottom-nav active indicator.
- **Landing/scroll animation:** GSAP + ScrollTrigger + Lenis, NOT Framer (see `tyme-landing-animations`). Both libraries are installed; pick by context.
- Forms are hand-rolled controlled inputs. Settings values auto-save (see `HourlyRateControl`: 500 ms debounce + "Saving/Saved" indicator); the SettingsView project manager uses explicit add/edit/delete forms with success toasts.

## Responsive convention

Desktop-first features with dedicated mobile variants, split at `md:` — e.g. Sidebar (desktop) vs fixed bottom nav (mobile), calendar week grid (desktop) vs day-tabs list + FAB (mobile). Always check both when changing navigation or calendar UI. Touch targets ≥44px (`min-h-[44px]`/`min-h-[48px]` on buttons/inputs).
