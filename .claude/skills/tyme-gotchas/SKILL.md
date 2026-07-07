---
name: tyme-gotchas
description: Known bugs, dead code, stale artifacts, and footguns in the Tyme repo, catalogued during the 2026-07 full audit and reconciled with the v2.3.2 multi-project + security-hardening merges. Read before refactoring, "cleaning up", debugging surprising behavior, or when something looks wrong and you're not sure if it's intentional. Each item says whether to fix, keep, or ask.
---

# Tyme Gotchas — Known Issues Register

Audited at v2.3.1 (2026-07-07), reconciled same day with the v2.3.2 merges (multi-project PR #10, security hardening). Legend: 🐛 real bug · 🧟 dead code · 📜 stale artifact · ⚠️ footgun (intentional but surprising).

## Bugs (safe to fix when touched)

1. 🐛 **Week picker accepts non-Monday weeks.** A valid 7-day pick sets `currentWeekMonday` to whatever day was chosen (e.g. Wed→Tue week). Rendering copes; "This week / Last week" active-state highlighting breaks because comparisons use `getMonday(new Date())`.
2. 🐛 **Desktop grid header 8h badge is hardcoded** (`totalMins >= 480` and "under target (8h)" at [CalendarView.tsx:1565](src/components/CalendarView.tsx)) — ignores the user's `workdayTargetHours` setting despite Settings promising it "marks visual indicators in the calendar".
3. 🐛 **`handleDeleteTag` is O(entries) sequential writes**: it rewrites EVERY entry (even ones without the tag) one `await` at a time to strip the tag name ([providers.tsx](src/app/providers.tsx)). `handleDeleteProject` does it better — filters to affected entries first — but is still sequential. Slow + realtime-refetch storm with large histories.

## Dead code (verify then delete freely)

4. 🧟 In **ReportsView**: `dailyDistribution` memo (contains a hardcoded month map `"06"→Jun, "05"→May` — never rendered), `donutChartSegments`, `averageHoursPerDay`/`distinctDaysCount`, `customStart/customEnd` state (frozen at "2026-06-01"; the `ReportFilter` type's `'custom'` preset has no UI), and `roundingActive` (no UI toggle → `getDisplayMinutes` is a pass-through; the setter is unused).
5. 🧟 In **CalendarView**: `selectTodayWeek`/`selectYesterdayWeek` duplicates of `selectThisWeek`; `timerIntervalId` state (interval handled in the effect); scattered `dark:` class remnants from the abandoned light theme.
6. 🧟 `handleSupabaseError` ([supabase.ts](src/lib/supabase.ts)) calls `supabase.auth.getUser()` without await and never uses it; `authInfo` is always null.
7. 🧟 The `theme`/`onThemeToggle` props threaded into Sidebar/CalendarView — theme is hardcoded `'dark'` in providers and the toggle is `() => {}`.

## Stale artifacts (don't trust them; ask before deleting from git)

8. 📜 **`dist/`** — a stale **Vite** production build from the pre-Next era (gitignored, still on disk). `npm run clean` removes it. Never serve it.
9. 📜 **`metadata.json`** ("MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API") and **`GEMINI_API_KEY`** in `.env` — Google AI Studio scaffolding; no code reads either. `package.json` name is still `react-example`.
10. 📜 **`faq-card-demo.html`** — standalone GSAP prototyping scratch file at the repo root.
11. 📜 `.antigravity/`, `.vscode/`, `assets/.aistudio/` — editor/tooling residue.

## Footguns (intentional — do NOT "fix" without a decision)

12. ⚠️ **`*ToFS` function names write to Supabase** (Firestore legacy naming). Renaming is a big cross-file diff — coordinate, don't drive-by.
13. ⚠️ **profiles save must stay select→insert/update** — NOT a single upsert (NOT NULL email/name vs partial updates). It also clamps/slices values to mirror the DB CHECK constraints. See tyme-data-layer.
14. ⚠️ **Entries store tag NAMES not ids** — renaming a tag would orphan entry tags (there is no rename feature today, partly because of this).
15. ⚠️ **`project_id: ''`** (empty string, not null) is written when an entry has no project.
16. ⚠️ **The CSP in next.config.ts is an allowlist.** New third-party scripts, fonts, or API endpoints must be added to `script-src`/`connect-src` or they're silently blocked in production. `connect-src` currently: self, `*.supabase.co` (https+wss), People API, Vercel Analytics.
17. ⚠️ **Reports timeline card is deliberately slate-blue** (`#11171d`), replicating a Clockify screenshot — not an espresso-theme oversight.
18. ⚠️ **"Billable" in the PDF equals total** — there is no billable flag; it's total hours restated. Don't invent a distinction.
19. ⚠️ **Never `next build` while `npm run dev` runs** — shared `.next/` gets clobbered and the dev server 500s. Typecheck with `npm run lint`.
20. ⚠️ **Claude preview tab freezes rAF** — GSAP/Lenis/Framer animation can't be visually verified in the preview browser; the page appears stuck at its initial state. Not a regression.
21. ⚠️ **OAuth redirect allow-list**: every new deploy origin + `{origin}/calendar` must be added in Supabase Auth → URL Configuration, or Google sign-in breaks only on that environment.
22. ⚠️ **`SITE_URL` is a placeholder** (`https://tyme.app`) feeding canonical/OG/sitemap/JSON-LD. Fine until a real domain exists; then change exactly one constant in seo.ts.
23. ⚠️ **Timer state in localStorage** (5 `tyme_timer_*` keys) survives reloads by design; logout clears them. A "phantom running timer" after login-as-different-user on the same browser would come from a missed clear — check providers.tsx `handleLogout`. Note the timer's project selection intentionally persists after Stop.
24. ⚠️ **Mixed id generations coexist**: rows created before v2.3.2 have `entry-{timestamp}-{rand}`/`tag-{timestamp}` ids; new rows use `{prefix}-{uuid}`. Never parse or sort by id shape.
25. ⚠️ **No tests, no ESLint.** `npm run lint` = `tsc --noEmit` only. The verification bar for changes is: typecheck clean + manual/preview walkthrough of the affected screen.

## Fixed in v2.3.2 (don't re-report; context for old branches)

- Timer ignoring the selected project (now logs `timerProjId`); the static project pill (now a live dropdown); the dummy `onAddProject` no-op (real multi-project CRUD).
- Hardcoded `dczabala2@gmail.com` in the print template (now `user?.email` via `useTyme()`).
- `GoogleLoginPopup.tsx` deleted; Firebase migration script + `tsx` dep deleted (recover via `git show de7d2d7~1:scripts/migrate-firebase-to-supabase.ts`).
- `security_spec.md` rewritten — it is now the authoritative RLS/CHECK spec, no longer a stale Firestore doc.
- CSV formula-injection (cells now go through `csvCell`); guessable `Date.now()`/`Math.random()` ids (now `crypto.randomUUID()`); missing security headers (CSP et al. in next.config.ts).
