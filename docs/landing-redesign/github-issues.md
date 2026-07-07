# GitHub Issues — Tesla-Inspired Landing Page Redesign

Deliverable for Task 3 of the landing redesign plan (see `teardown-and-decisions.md` for the
research behind these). Paste each block into GitHub individually, or run
`scripts/create-landing-issues.sh` to create all of them (and the 4 milestones) in one pass.

Repo: `dczii/tyme`. Stack notes assume Next.js 15 App Router, React 19, TS strict, Tailwind v4
(`@theme` in `src/app/globals.css`), GSAP 3 + ScrollTrigger, Lenis, Supabase auth, Vercel.
Every issue's acceptance criteria includes `npm run lint` (the repo's only check — it runs
`tsc --noEmit`; there is no CI, so this is a manual gate) passing and, per repo convention, a
`package.json` patch version bump in the same commit.

---

## Milestone 1: Static Layout & Copy

### Issue 1.1
**Title:** Enforce single headline + sub-line + 2-CTA rule in Hero
**Labels:** copy, frontend
**Milestone:** M1: Static Layout & Copy

**Description:** Tesla never lets a panel run more than one headline, one sub-line, and two
CTAs. Tyme's hero (`AppShowcase`) currently centers on the app screenshot without a hard
content contract. Rewrite the hero copy props to exactly one headline (2–5 words), one
sub-line (concrete benefit, not a paragraph), and confirm exactly two CTAs render (primary:
Google sign-in via `SignInButton`, secondary: "See how it works" anchor scroll).

**Acceptance criteria:**
- [ ] Hero renders exactly one `<h1>`, one sub-line `<p>`, and exactly 2 CTA elements
- [ ] Primary CTA triggers `googleSignIn()` via existing `SignInButton`
- [ ] Secondary CTA smooth-scrolls to the "How it works" section anchor
- [ ] Copy reviewed against the formula in `docs/landing-redesign/teardown-and-decisions.md`
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/page.tsx` (hero section block), `src/components/landing/scroll/AppShowcase.tsx`, `src/components/landing/SignInButton.tsx`.

**Dependencies:** None.

---

### Issue 1.2
**Title:** Audit all landing sections for the 2-CTA-max rule
**Labels:** copy, frontend
**Milestone:** M1: Static Layout & Copy

**Description:** Tesla's one-product-per-panel discipline requires every section to carry at
most two CTAs (and the FAQ, zero). Audit Features, How-it-works, and the Final CTA band in
`page.tsx` for stray extra links/buttons that dilute the primary action, and trim to the
2-CTA contract.

**Acceptance criteria:**
- [ ] Written audit (in PR description) listing every CTA per section, before/after
- [ ] Features section has 0 or 1 CTA (informational panel, per Tesla spec-callout pattern)
- [ ] How-it-works section has at most 1 CTA
- [ ] Final CTA band has exactly 2 CTAs (primary Google, secondary email/password → `/login`)
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/page.tsx` full pass; check `FeatureShowcase.tsx`, `FaqShowcase.tsx` for embedded links.

**Dependencies:** Blocked by: #Enforce single headline + sub-line + 2-CTA rule in Hero.

---

### Issue 1.3
**Title:** Convert How-it-works section to 3 spec-style cards
**Labels:** copy, design, frontend
**Milestone:** M1: Static Layout & Copy

**Description:** Tesla teases specs in short callouts rather than paragraphs. Replace the
current 3-step paragraph copy in the How-it-works section with 3 short spec cards (icon +
one-line benefit each), matching the terse, scannable style Tesla uses for feature callouts.

**Acceptance criteria:**
- [ ] Each of the 3 steps reduced to a single line (≤ 12 words) plus an icon
- [ ] Layout uses existing glassmorphism card pattern (`bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl`)
- [ ] Responsive at mobile (stacked) and desktop (3-up grid)
- [ ] No new CTA introduced in this section (see #1.2)
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/page.tsx` (How-it-works block, currently `Reveal`-staggered paragraphs). Reuse existing icon set already imported in the file.

**Dependencies:** None.

---

### Issue 1.4
**Title:** Add full-viewport scroll-snap structure to top-level panels
**Labels:** frontend, design
**Milestone:** M1: Static Layout & Copy

**Description:** Tesla's panels are soft scroll-snap (each section fully occupies the
viewport, snap is gentle, never traps scroll). Add CSS `scroll-snap-type: y proximity` (not
`mandatory`, to avoid trapping users the way Tesla itself avoids) to the top-level section
wrapper in `page.tsx`, with `scroll-snap-align: start` on Hero, Features, and Final CTA
(FAQ and Footer excluded — they read better as free-scroll).

**Acceptance criteria:**
- [ ] Hero, Features, Final CTA sections snap to viewport top on scroll (desktop)
- [ ] FAQ and Footer remain free-scroll (no snap-align)
- [ ] Snap does not interfere with existing Lenis smooth-scroll (`SmoothScrollProvider`) or ScrollTrigger pinning in `FeatureShowcase`
- [ ] Verified on mobile Safari/Chrome (snap disabled or tuned if it fights native momentum scroll)
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/page.tsx`, `src/components/landing/scroll/SmoothScrollProvider.tsx`. Test interaction with Lenis carefully — CSS scroll-snap and JS-driven smooth scroll can conflict.

**Dependencies:** None. Should land before Issue 2.1 (nav transition) since layout changes may shift scroll thresholds.

---

### Issue 1.5
**Title:** Unify landing typography to a 3-size modular scale
**Labels:** design, frontend
**Milestone:** M1: Static Layout & Copy

**Description:** Tesla uses at most 2–3 type sizes per breakpoint. Audit the landing page's
`@theme` font tokens in `globals.css` and consolidate ad-hoc `text-*` sizes on the landing
page into a documented 3-tier scale (display/headline/body) using the existing `--font-display`
(Geist) and `--font-sans` (Inter) tokens.

**Acceptance criteria:**
- [ ] 3 documented type tiers added as comments or tokens in `globals.css`
- [ ] All headings on `page.tsx` mapped to the headline tier, no more than 3 distinct font-size classes used across the whole landing page
- [ ] Visual diff reviewed at mobile (375px) and desktop (1440px) widths
- [ ] No regression to in-app (`/calendar`, `/reports`) typography, which is out of scope
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/globals.css` (`@theme` block), `src/app/page.tsx`. Scope strictly to landing page classes — do not touch app-shell typography.

**Dependencies:** None.

---

## Milestone 2: Motion & Animation Layer

### Issue 2.1
**Title:** Add scroll-driven transparent-to-solid header transition
**Labels:** animation, frontend
**Milestone:** M2: Motion & Animation Layer

**Description:** Tesla's single highest-value micro-animation is the nav bar going from
transparent-over-hero to a solid/blurred bar once the user scrolls past the first panel. Add
a ScrollTrigger-driven (or scroll-listener-driven) class toggle on the sticky header in
`page.tsx` that crossfades background opacity + backdrop-blur once the hero panel scrolls
out of view.

**Acceptance criteria:**
- [ ] Header is transparent (or near-transparent) over the hero, solid+blurred after
- [ ] Transition uses existing glassmorphism tokens (`bg-[#130d0a]/35 backdrop-blur-xl`)
- [ ] Transition respects `prefers-reduced-motion` (instant swap, no animated crossfade)
- [ ] No layout shift introduced by the header state change (fixed height maintained)
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/page.tsx` (header block), reuse GSAP/ScrollTrigger already imported for `FeatureShowcase.tsx` as a pattern reference.

**Dependencies:** Blocked by: #Add full-viewport scroll-snap structure to top-level panels.

---

### Issue 2.2
**Title:** Add reduced-motion and mobile guards to Hero entrance animation
**Labels:** animation, performance
**Milestone:** M2: Motion & Animation Layer

**Description:** Tesla's motion budget is deliberately restrained — a subtle fade/parallax on
hero imagery, nothing heavier. Audit the existing `AppShowcase` GSAP entrance timeline and
add explicit `prefers-reduced-motion` and small-viewport guards so the animation degrades to
a simple fade (or no animation) rather than running the full timeline on low-power devices.

**Acceptance criteria:**
- [ ] `matchMedia('(prefers-reduced-motion: reduce)')` check disables translate/parallax, keeps opacity fade only
- [ ] Timeline is skipped or simplified below a defined viewport width (e.g. < 480px)
- [ ] No Cumulative Layout Shift introduced by the entrance animation (measure via Chrome DevTools Performance panel)
- [ ] Manually verified in Chrome with "Emulate CSS prefers-reduced-motion" toggled on
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/AppShowcase.tsx`. Follow existing `gsap.matchMedia()` patterns if already used elsewhere in the codebase.

**Dependencies:** None.

---

### Issue 2.3
**Title:** Cap and guard FeatureShowcase ScrollTrigger pin on mobile
**Labels:** animation, performance
**Milestone:** M2: Motion & Animation Layer

**Description:** Tesla avoids scroll-jacking beyond a single restrained use. Tyme's pinned
"card deal" effect in `FeatureShowcase` is a good centerpiece animation but should not run
its full pin+scrub on small viewports where pinning tends to feel janky and hurts scroll
performance. Add a viewport guard that disables pinning below a breakpoint and falls back to
a simple staggered reveal.

**Acceptance criteria:**
- [ ] ScrollTrigger pin disabled below a defined breakpoint (match existing Tailwind `md:` breakpoint)
- [ ] Mobile fallback uses a simple `Reveal`-style stagger instead of pin+scrub
- [ ] Desktop pin behavior unchanged and verified still smooth (no dropped frames in DevTools Performance recording)
- [ ] `prefers-reduced-motion` disables both pin and stagger, showing final state directly
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/FeatureShowcase.tsx`. Use `gsap.matchMedia()` to scope the pinned timeline to desktop only.

**Dependencies:** None.

---

### Issue 2.4
**Title:** Add snap-per-question interaction to FAQ horizontal gallery
**Labels:** animation, frontend
**Milestone:** M2: Motion & Animation Layer

**Description:** The FAQ section already scrolls horizontally (`FaqShowcase`); Tesla-level
polish means each swipe/scroll settles on a full question card rather than stopping
mid-card. Add scroll-snap (`scroll-snap-type: x mandatory` on the track, `scroll-snap-align:
center` per card) plus keyboard arrow-key navigation for accessibility parity.

**Acceptance criteria:**
- [ ] Horizontal scroll settles on a full FAQ card after mouse wheel, trackpad, or touch swipe
- [ ] Left/Right arrow keys move focus and scroll to the adjacent card when a card is focused
- [ ] Cards remain reachable via Tab key in DOM order
- [ ] No regression to existing GSAP-driven entrance animation for the gallery
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/FaqShowcase.tsx`.

**Dependencies:** None.

---

## Milestone 3: Registration Flow Integration

### Issue 3.1
**Title:** Wire direct Google OAuth CTA into Hero and Final CTA band
**Labels:** auth, frontend
**Milestone:** M3: Registration Flow Integration

**Description:** Tesla's primary CTA is a single zero-friction commit action. Ensure the
Hero and Final CTA band both use the existing `SignInButton` (direct `googleSignIn()`) as the
primary action rather than routing through an intermediate page, matching the "one click to
commit" pattern.

**Acceptance criteria:**
- [ ] Hero primary CTA calls `googleSignIn()` directly via `SignInButton`
- [ ] Final CTA band primary button calls `googleSignIn()` directly via `SignInButton`
- [ ] Already-authenticated visitors clicking either CTA redirect straight to `/calendar` (reuse existing auto-redirect logic)
- [ ] No duplicate Supabase client instances created by reusing `SignInButton` in two places
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/SignInButton.tsx`, `src/app/page.tsx` (hero + final CTA blocks), `src/lib/supabase.ts` (`googleSignIn`).

**Dependencies:** Blocked by: #Enforce single headline + sub-line + 2-CTA rule in Hero.

---

### Issue 3.2
**Title:** Add secondary email/password CTA path to /login from landing
**Labels:** auth, frontend
**Milestone:** M3: Registration Flow Integration

**Description:** Per the adaptation decision to reuse existing auth code rather than build a
new modal, wire the secondary CTA on Hero/Final CTA to `/login`, deep-linked into the
`register` mode of `LoginScreen`'s existing signin/register toggle, so a new visitor lands
directly on the sign-up form instead of the default sign-in form.

**Acceptance criteria:**
- [ ] Secondary CTA links to `/login?mode=register`
- [ ] `LoginScreen` reads the `mode` query param and initializes its toggle state accordingly
- [ ] Sign-in mode (`/login` with no param) behavior is unchanged
- [ ] Already-authenticated visitors still auto-redirect to `/calendar`
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/login/page.tsx`, `src/components/LoginScreen.tsx` (mode state, currently internal-only).

**Dependencies:** Blocked by: #Wire direct Google OAuth CTA into Hero and Final CTA band.

---

### Issue 3.3
**Title:** Add OAuth callback loading/error states with toast feedback
**Labels:** auth, frontend
**Milestone:** M3: Registration Flow Integration

**Description:** A registration flow this exposed on the landing page needs visible feedback
when Google OAuth fails or is slow (popup blocked, network error, denied consent), rather
than silently doing nothing — a common conversion leak Tesla's own single-click flows avoid
by always showing state.

**Acceptance criteria:**
- [ ] Clicking either Google CTA shows a loading state on the button (disabled + spinner or equivalent)
- [ ] OAuth error (denied, network failure) surfaces an existing toast component with a clear retry message
- [ ] Timeout after a reasonable interval (e.g. 15s) resets the button state if no redirect occurred
- [ ] Manually tested by denying the Google consent screen and by throttling network in DevTools
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/SignInButton.tsx`, `src/lib/supabase.ts` (`googleSignIn`), existing toast utility (check `src/components` for the app's toast pattern already used elsewhere).

**Dependencies:** Blocked by: #Wire direct Google OAuth CTA into Hero and Final CTA band.

---

### Issue 3.4
**Title:** Instrument landing CTA clicks with Vercel Analytics events
**Labels:** frontend, performance
**Milestone:** M3: Registration Flow Integration

**Description:** Friction should be measured, not guessed. Add custom Vercel Analytics
events (`track()` from `@vercel/analytics`) firing on every CTA click on the landing page,
labeled by section and CTA type, so conversion-by-section can be measured post-launch.

**Acceptance criteria:**
- [ ] Every CTA (Hero primary/secondary, Final CTA primary/secondary, header nav button) fires a distinct named event on click
- [ ] Event names documented in a short table in the PR description
- [ ] No PII included in event payloads
- [ ] Verified events appear in the Vercel Analytics dashboard (or local debug mode) after a manual click-through
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `@vercel/analytics` already mounted in `src/app/layout.tsx`; add `track()` calls at each CTA's `onClick`.

**Dependencies:** Blocked by: #Wire direct Google OAuth CTA into Hero and Final CTA band, #Add secondary email/password CTA path to /login from landing.

---

## Milestone 4: SEO, Analytics & Performance

### Issue 4.1
**Title:** Convert hero image to priority next/image sized for LCP < 2.5s
**Labels:** performance, seo
**Milestone:** M4: SEO, Analytics & Performance

**Description:** Tesla's own biggest Core Web Vitals risk is hero imagery — and their fix is
prioritizing the hero image over any competing media. Audit the Hero (`AppShowcase`)
screenshot rendering and ensure it uses `next/image` with `priority`, explicit
`width`/`height` (or `fill` with a sized parent), and a modern format, then measure LCP.

**Acceptance criteria:**
- [ ] Hero image uses `next/image` with `priority` set
- [ ] Explicit dimensions or `fill` + aspect-ratio-boxed parent (no intrinsic-size layout shift)
- [ ] Lighthouse (mobile, throttled) reports LCP < 2.5s on the landing page
- [ ] Largest Contentful Paint element confirmed (via Lighthouse/DevTools) to be the hero image, not a later-loading section
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/AppShowcase.tsx`. Run `npm run build && npm run start` (never against the dev server) before measuring, per repo convention.

**Dependencies:** None.

---

### Issue 4.2
**Title:** Reserve layout space for all animated sections to hit CLS < 0.1
**Labels:** performance, frontend
**Milestone:** M4: SEO, Analytics & Performance

**Description:** GSAP/ScrollTrigger-initialized sections can shift layout before JS hydrates
and measures the DOM. Audit `FeatureShowcase` and `FaqShowcase` for any pre-hydration size
change (e.g. pinned container height set only after ScrollTrigger initializes) and add
explicit min-height/aspect-ratio reservations so nothing shifts after first paint.

**Acceptance criteria:**
- [ ] `FeatureShowcase` pinned container has an explicit reserved height before ScrollTrigger runs
- [ ] `FaqShowcase` gallery track has a reserved min-height matching card height
- [ ] Lighthouse (mobile, throttled) reports CLS < 0.1 on the landing page
- [ ] Verified visually with Chrome DevTools "Layout Shift Regions" overlay showing no shifts on load
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/FeatureShowcase.tsx`, `src/components/landing/scroll/FaqShowcase.tsx`.

**Dependencies:** Blocked by: #Convert hero image to priority next/image sized for LCP < 2.5s (run Lighthouse together to confirm combined score).

---

### Issue 4.3
**Title:** Extend JSON-LD with Organization schema and verify OG image dimensions
**Labels:** seo
**Milestone:** M4: SEO, Analytics & Performance

**Description:** Tesla pairs Product schema with Organization schema. Extend the existing
`structuredData[]` array in `src/lib/seo.ts` (currently `SoftwareApplication`, `WebSite`,
`FAQPage`) with an `Organization` entry, and verify `public/og-image.png` is exactly 1200×630
so social previews render correctly across platforms.

**Acceptance criteria:**
- [ ] `Organization` JSON-LD entry added to `structuredData[]` in `seo.ts` with name, url, logo
- [ ] New entry rendered in `layout.tsx`'s existing JSON-LD injection alongside current schemas
- [ ] `public/og-image.png` confirmed (or resized) to 1200×630
- [ ] Validated via Google's Rich Results Test (or schema.org validator) with no errors
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/lib/seo.ts`, `src/app/layout.tsx` (JSON-LD injection, lines ~81-89), `public/og-image.png`.

**Dependencies:** None.

---

### Issue 4.4
**Title:** Add Vercel Speed Insights and document a manual Lighthouse budget check
**Labels:** performance
**Milestone:** M4: SEO, Analytics & Performance

**Description:** The repo has no CI, so Core Web Vitals regressions can currently only be
caught manually. Add `@vercel/speed-insights` (same integration pattern as the existing
`@vercel/analytics`) for real-user monitoring, and document a simple manual Lighthouse check
in `docs/landing-redesign/` so LCP/CLS budgets stay visible without CI enforcement.

**Acceptance criteria:**
- [ ] `@vercel/speed-insights` package added and `<SpeedInsights />` mounted in `layout.tsx`
- [ ] Confirmed reporting data in the Vercel dashboard after a deploy
- [ ] `docs/landing-redesign/performance-budget.md` added documenting the LCP < 2.5s / CLS < 0.1 targets and the manual Lighthouse steps to check them
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/app/layout.tsx` (mirror existing `<Analytics />` mount pattern).

**Dependencies:** Blocked by: #Convert hero image to priority next/image sized for LCP < 2.5s, #Reserve layout space for all animated sections to hit CLS < 0.1 (budget doc should reflect post-fix numbers).

---

### Issue 4.5
**Title:** Lazy-init below-the-fold GSAP sections via IntersectionObserver
**Labels:** performance
**Milestone:** M4: SEO, Analytics & Performance

**Description:** `FeatureShowcase` and `FaqShowcase` currently initialize their GSAP
timelines on mount regardless of scroll position. Gate their animation setup behind an
`IntersectionObserver` (init only once the section approaches the viewport) to cut initial
JS execution work and improve Time to Interactive on the landing page.

**Acceptance criteria:**
- [ ] `FeatureShowcase` GSAP timeline setup deferred until the section is within ~200px of viewport
- [ ] `FaqShowcase` GSAP timeline setup deferred the same way
- [ ] No visible flash of unanimated content when scrolling quickly to these sections
- [ ] Lighthouse Total Blocking Time improves or holds steady versus the pre-change baseline
- [ ] `npm run lint` passes; `package.json` patch version bumped

**Technical notes:** `src/components/landing/scroll/FeatureShowcase.tsx`, `src/components/landing/scroll/FaqShowcase.tsx`.

**Dependencies:** Blocked by: #Cap and guard FeatureShowcase ScrollTrigger pin on mobile, #Add snap-per-question interaction to FAQ horizontal gallery.

---

## Epic / Tracking Issue

### Issue E.1
**Title:** Epic: Tesla-inspired landing page redesign
**Labels:** design
**Milestone:** M1: Static Layout & Copy

**Description:** Tracking issue for the full landing page redesign inspired by Tesla's
regional site polish (see `docs/landing-redesign/teardown-and-decisions.md` for the teardown
and adaptation decisions this work is based on). Landing page code lives in `src/app/page.tsx`
and `src/components/landing/`.

**Acceptance criteria:**
- [ ] All linked issues closed
- [ ] Final Lighthouse run on production confirms LCP < 2.5s and CLS < 0.1
- [ ] `docs/landing-redesign/teardown-and-decisions.md` decisions all reflected in shipped code

**Task list:**

Milestone 1: Static Layout & Copy
- [ ] #Enforce single headline + sub-line + 2-CTA rule in Hero
- [ ] #Audit all landing sections for the 2-CTA-max rule
- [ ] #Convert How-it-works section to 3 spec-style cards
- [ ] #Add full-viewport scroll-snap structure to top-level panels
- [ ] #Unify landing typography to a 3-size modular scale

Milestone 2: Motion & Animation Layer
- [ ] #Add scroll-driven transparent-to-solid header transition
- [ ] #Add reduced-motion and mobile guards to Hero entrance animation
- [ ] #Cap and guard FeatureShowcase ScrollTrigger pin on mobile
- [ ] #Add snap-per-question interaction to FAQ horizontal gallery

Milestone 3: Registration Flow Integration
- [ ] #Wire direct Google OAuth CTA into Hero and Final CTA band
- [ ] #Add secondary email/password CTA path to /login from landing
- [ ] #Add OAuth callback loading/error states with toast feedback
- [ ] #Instrument landing CTA clicks with Vercel Analytics events

Milestone 4: SEO, Analytics & Performance
- [ ] #Convert hero image to priority next/image sized for LCP < 2.5s
- [ ] #Reserve layout space for all animated sections to hit CLS < 0.1
- [ ] #Extend JSON-LD with Organization schema and verify OG image dimensions
- [ ] #Add Vercel Speed Insights and document a manual Lighthouse budget check
- [ ] #Lazy-init below-the-fold GSAP sections via IntersectionObserver

**Dependencies:** None (parent tracking issue).
