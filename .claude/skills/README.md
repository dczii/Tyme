# Tyme Skill Library

Project-scoped skills for the Tyme repo, written as a principal-engineer handoff after a full codebase audit at **v2.3.1 (2026-07-07)** and reconciled with the v2.3.2 merges (multi-project support, security hardening). Agents auto-discover these from the frontmatter; this index is for humans.

## The handoff set (`tyme-*`)

| Skill | Read it when… |
|---|---|
| [tyme-architecture](tyme-architecture/SKILL.md) | Starting ANY task. Routes, data flow, TymeProvider, the single-project model, project history. |
| [tyme-data-layer](tyme-data-layer/SKILL.md) | Touching Supabase: auth/OAuth, schema, realtime, RLS, Google Contacts, migration script. |
| [tyme-conventions](tyme-conventions/SKILL.md) | Running, committing (version-bump ritual!), deploying, or styling anything (espresso palette, fonts, glass panels). |
| [tyme-calendar](tyme-calendar/SKILL.md) | Working in CalendarView: grid math, the persistent timer, drag-and-drop, week picker, modals. |
| [tyme-reports-pdf](tyme-reports-pdf/SKILL.md) | Working in ReportsView: filters, charts, CSV, the jsPDF export vs the hidden print template. |
| [tyme-landing-animations](tyme-landing-animations/SKILL.md) | Touching the marketing page: GSAP/Lenis scenes, intro gating, reduced-motion and SEO rules. |
| [tyme-seo](tyme-seo/SKILL.md) | Editing copy/metadata: seo.ts single source of truth, JSON-LD, robots/sitemap/llms.txt. |
| [tyme-gotchas](tyme-gotchas/SKILL.md) | Before refactoring or when behavior looks wrong: the known-bugs & dead-code register. |

Suggested reading order for a new teammate: architecture → conventions → data-layer → the skill for whichever screen you're changing → gotchas (always, before you refactor).

## Vendored references (symlinks → `.agents/skills/`)

`gsap-*` (official GSAP API skills), `design-taste-frontend`, `imagegen-frontend-web` — installed via `skills-lock.json`. The GSAP ones pair with `tyme-landing-animations`: that skill tells you how THIS repo uses GSAP; the vendored ones document the API itself.

## Non-negotiables (the shortlist every contributor must know)

1. `npm run lint` (= `tsc --noEmit`) is the only automated check; never `next build` while dev is running.
2. Bump `package.json` version in every feature/fix commit — it renders in the Sidebar.
3. RLS + the CHECK constraints in `security_spec.md` are the entire security model; the CSP in `next.config.ts` is an allowlist — new external endpoints/scripts must be added there.
4. `profiles` saves stay select→insert/update (NOT plain upsert). `*ToFS` names write to Supabase.
5. Landing copy lives in `src/lib/seo.ts`; animations must never hide SSR content; reduced motion bails out first.
6. New deploy origins must be added to Supabase Auth redirect URLs or Google login breaks.
