# Landing Conversion Backlog — GitHub Issues

One block per issue, ready to paste. See [landing-conversion-plan.md](landing-conversion-plan.md) for the teardown and decisions, and [`scripts/create-landing-issues.sh`](../scripts/create-landing-issues.sh) to create everything in one run.

---

## Milestone 1: Static layout & copy

---

### Title: Restructure landing into full-viewport conversion panels
**Labels:** `frontend`, `design`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla's regional page is a stack of full-viewport panels, one message each, so every scroll stop has a single job. Restructure `src/app/page.tsx` so each major section (hero, features, proof-band placeholder, how-it-works, pricing placeholder, FAQ, final CTA) renders as a `min-h-[100svh]` panel with shared vertical rhythm. Markup/layout only — no new motion; existing GSAP scenes must keep working untouched.

**Acceptance criteria**
- [ ] Each top-level section on `/` fills ≥100svh on desktop and mobile without clipping content or horizontal scroll
- [ ] Existing GSAP scenes (AppShowcase, FeatureShowcase, FaqShowcase) render and animate unchanged
- [ ] Section order: hero → features → proof band (empty shell) → how-it-works → pricing (empty shell) → FAQ → final CTA
- [ ] No CSS `scroll-snap` introduced (conflicts with Lenis smooth wheel — snapping arrives in Milestone 2 via ScrollTrigger)
- [ ] `npm run lint` passes; page reads correctly with JavaScript disabled

**Technical notes**
Use `100svh`, not `100vh` (mobile URL-bar collapse). Keep the `SectionComment` view-source labels. Pinned scenes (FeatureShowcase pin, FAQ stage) manage their own scroll length — wrap them, never resize them. Espresso tokens per house style (`#0c0806` bg, `#3e271a` borders).

**Dependencies**
None.

---

### Title: Build hero dual-CTA block with headline and sub-line
**Labels:** `frontend`, `copy`, `design`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla's hero is headline + one sub-line carrying the price + exactly two CTAs ("Order Now" primary, "Learn More" secondary). Our hero currently has a single Google button. Replace it with the dual pair: primary **"Start tracking free"** (registration entry) and secondary **"See how it works"** (anchor to `#how-it-works`), with a sub-line stating the price fact: "Free for freelancers and VAs. No credit card."

**Acceptance criteria**
- [ ] Hero shows exactly two CTAs: primary copper (`bg-[#a66e46]`, hover `#8e5a34`) and quiet secondary variant
- [ ] Primary CTA triggers the existing Google OAuth flow for now (modal swap happens in Milestone 3); secondary smooth-scrolls to `#how-it-works`
- [ ] Sub-line under the H1 states free pricing in ≤90 chars
- [ ] Both CTAs ≥44px touch height, visible focus ring, WCAG AA contrast
- [ ] H1, sub-line, and CTA labels present in SSR HTML (view-source)

**Technical notes**
Heading block lives in `src/components/landing/scroll/AppShowcase.tsx`. Create a shared `CtaButton` (or extend `SignInButton` variants) so hero/pricing/final-CTA/mobile-bar reuse one component. Add the CTA row to the existing hero entrance timeline's heading refs so it staggers in with the heading (gated on `introDone`). Anchor scroll should route through Lenis (`lenis.scrollTo`) with native fallback.

**Dependencies**
None (final copy arrives with "Rewrite landing copy in seo.ts" — placeholders fine).

---

### Title: Rewrite landing copy in seo.ts using the panel copy formula
**Labels:** `copy`, `seo`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla gives every panel one product, a ≤6-word headline, and a sub-line that carries a number (price, range). Rewrite all landing copy to that formula: benefit-first headlines, one concrete fact per sub-line, in the established keyword register ("time tracking app", "freelancers", "virtual assistants", "billable hours", "Clockify alternative"). All feature/FAQ copy is edited **only** in `src/lib/seo.ts` — it feeds both the visible sections and the JSON-LD.

**Acceptance criteria**
- [ ] Every section headline ≤6 words, benefit-first; every sub-line ≤1 sentence with a concrete fact
- [ ] Feature and FAQ copy changed only in `seo.ts` (no hardcoded strings added to components)
- [ ] Each target keyword appears at least once in visible copy
- [ ] `public/llms.txt` updated to match (it is hand-written, not generated)
- [ ] FAQPage/SoftwareApplication JSON-LD (built from the same arrays) validates in Google's Rich Results Test

**Technical notes**
`seo.ts` exports `productFeatures[]` (title/description/feature) and `faqItems[]`. Renamed or added FAQ items need matching entries in `FAQ_META` inside `FaqShowcase.tsx` (falls back gracefully but tag/icon go generic). FAQ answers must remain SSR-rendered (`<dd>` always visible). No fabricated urgency, user counts, or ratings — factual claims only.

**Dependencies**
None.

---

### Title: Build stats proof band with monospace numeral tiles
**Labels:** `frontend`, `design`, `copy`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla panels sell with numbers (range, 0-100 time, price), not adjectives. Add a proof-band panel of 3–4 stat tiles using honest product facts — e.g. "1-click Google sign-in", "2 export formats (PDF + CSV)", "₱0 forever", "7-day week view" — set in JetBrains Mono numerals per the app's numeral convention.

**Acceptance criteria**
- [ ] 3–4 stat tiles: numerals in `font-mono` accent tan (`#dda67a`), labels uppercase mono `tracking-wider`
- [ ] Every stat is a verifiable product fact (no invented user counts or ratings)
- [ ] Responsive: stacked on mobile, single row ≥`md`; WCAG AA contrast
- [ ] Content SSR-rendered and static (entrance animation is a Milestone 2 issue)

**Technical notes**
New `src/components/landing/StatsBand.tsx` — server component, no `"use client"`. Glass panel house pattern: `bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl`. Slots into the proof-band shell created by the panel restructure.

**Dependencies**
Blocked by: #Restructure landing into full-viewport conversion panels

---

### Title: Build "Free forever" pricing panel with dual CTA
**Labels:** `frontend`, `copy`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla puts the price directly under the headline and repeats the same two CTAs on every panel. Our price story is "free" — give it its own panel: headline, one price line, ≤3 included-features bullets, and the same dual CTA pair as the hero. This answers the cost objection before the FAQ has to.

**Acceptance criteria**
- [ ] Panel shows headline + "₱0 — free forever" price line + ≤3 bullet inclusions
- [ ] Same two CTA components as the hero (primary registration, secondary anchor), identical styling
- [ ] No fabricated urgency or scarcity copy (no countdowns, no "limited seats")
- [ ] SSR-rendered; pricing statement consistent with the FAQ answer and the JSON-LD Offer (price 0)

**Technical notes**
New section in `page.tsx` or `src/components/landing/PricingPanel.tsx`. Reuse the shared `CtaButton` from the hero issue. The SoftwareApplication schema in `seo.ts` already declares a free Offer — keep visible copy and schema telling the same story.

**Dependencies**
Blocked by: #Restructure landing into full-viewport conversion panels, #Build hero dual-CTA block with headline and sub-line

---

### Title: Add static sticky mobile CTA bar below the fold
**Labels:** `frontend`, `design`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla's mobile page keeps the order/learn CTAs docked at the bottom edge so conversion is never more than one thumb-tap away. Add a fixed bottom CTA bar on `<md` viewports with the primary CTA plus a compact secondary link. Static in this milestone — scroll-aware show/hide is a Milestone 2 issue.

**Acceptance criteria**
- [ ] Bar fixed to the bottom on <768px viewports, absent ≥`md`
- [ ] Uses the `.pb-safe` safe-area helper; touch target ≥44px; bar height ≥56px
- [ ] Primary CTA performs the identical action as the hero primary
- [ ] Bar hidden for signed-in users (auth-aware via `useTyme()`)
- [ ] Zero layout shift: the bar overlays content (fixed), never inserts into flow

**Technical notes**
New client component `src/components/landing/MobileCtaBar.tsx`. z-index above content, below the intro splash (z-9999). Glassmorphism panel per house style. The landing page has no bottom nav (that's the app shell), so no conflict — but verify against `globals.css` mobile helpers.

**Dependencies**
Blocked by: #Restructure landing into full-viewport conversion panels

---

### Title: Normalize heading hierarchy, landmarks, and AA contrast
**Labels:** `seo`, `frontend`, `design`
**Milestone:** Milestone 1: Static layout & copy

**Description**
Tesla keeps a strict single-h1, per-panel-h2 hierarchy that mirrors its nav. Audit the rebuilt page: exactly one h1 (hero), each panel led by an h2, cards/steps as h3; header and footer anchor navs cover all panels; and verify WCAG AA contrast across the low-opacity cream text introduced by new sections. Run this last in the milestone.

**Acceptance criteria**
- [ ] Exactly one h1; every panel has an h2; no skipped heading levels
- [ ] Header + footer nav link to all anchor targets (features, how-it-works, pricing, faq)
- [ ] All text passes WCAG AA (4.5:1 normal / 3:1 large) — audit `#ecd0b9` at /50–/85 opacities on `#0c0806` and bump failing values
- [ ] Landmarks: one `main`, labelled `nav`s, sections tied to headings via `aria-labelledby`
- [ ] Axe DevTools scan of `/` shows zero critical violations

**Technical notes**
Cream `#ecd0b9` below roughly /60 opacity on the espresso background fails AA for body text — check each usage with a contrast tool rather than guessing. Keep `SectionComment` labels intact. Decorative glow blobs stay `aria-hidden` + `pointer-events-none`.

**Dependencies**
Blocked by: #Restructure landing into full-viewport conversion panels, #Build hero dual-CTA block with headline and sub-line, #Build stats proof band with monospace numeral tiles, #Build "Free forever" pricing panel with dual CTA, #Add static sticky mobile CTA bar below the fold

---

## Milestone 2: Motion & animation layer

---

### Title: Add desktop panel snapping via ScrollTrigger
**Labels:** `animation`, `frontend`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
Tesla snaps each scroll gesture to the next full-viewport panel. CSS scroll-snap fights Lenis's smooth wheel, so implement snapping with ScrollTrigger's `snap` on desktop pointer devices only, tuned to feel assistive — a settle, not a hijack.

**Acceptance criteria**
- [ ] Wheel scroll settles on panel boundaries for non-pinned panels on ≥`lg` fine-pointer devices
- [ ] Pinned scenes (Features, FAQ) are excluded — snap never fights an active pin
- [ ] Touch devices and `prefers-reduced-motion` users get native scrolling (no snap)
- [ ] Snap is directional with ≤0.8s ease; the user can always scroll through without being trapped
- [ ] No ScrollTrigger console warnings; `ctx.revert()` cleans up on unmount

**Technical notes**
Extend `SmoothScrollProvider.tsx` or add a `SnapController` client component. Gate with `gsap.matchMedia('(min-width:1024px) and (prefers-reduced-motion: no-preference)')` plus a pointer-fine check. Compute panel-top offsets in a function with `invalidateOnRefresh: true`; snap only between the FAQ pin end and Features pin start ranges. Lenis `lerp` stays 0.1; remember Lenis smooths wheel only.

**Dependencies**
Blocked by: #Restructure landing into full-viewport conversion panels

---

### Title: Add entrance reveals to proof band and pricing panels
**Labels:** `animation`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
Tesla fades panel content up as it enters the viewport. Our lightweight equivalent already exists — the `Reveal` utility (IntersectionObserver + Framer). Apply staggered reveals to the stat tiles and pricing content, and give the stat numerals a one-shot count-up that respects reduced motion.

**Acceptance criteria**
- [ ] Stat tiles and pricing content rise/fade with ≤0.08s stagger on first entry, no re-trigger on scroll-back
- [ ] Numerals count up once (~0.8s) when the band enters; reduced-motion users see final values immediately
- [ ] Content fully visible with JS disabled — animation layers opacity/transform on top of visible SSR markup
- [ ] `npm run lint` passes; no hydration warnings

**Technical notes**
Use `Reveal.tsx` (rootMargin -12%, 16px rise, `[0.16,1,0.3,1]`) before reaching for GSAP — house rule. Count-up: integer tween on a ref in `useLayoutEffect`, guarded by `if (reduce) return;` *before* any `gsap.set` that changes displayed values. Below the fold, so no `introDone` gate needed.

**Dependencies**
Blocked by: #Build stats proof band with monospace numeral tiles, #Build "Free forever" pricing panel with dual CTA

---

### Title: Animate sticky mobile CTA bar on scroll direction
**Labels:** `animation`, `frontend`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
Tesla's docked mobile CTAs get out of the way while you read and return when you pause or reverse. Make the static bar scroll-aware: hidden over the hero and final CTA panels (both already show large CTAs), slides in after the hero, slides away on a downward fling, returns on any upward scroll.

**Acceptance criteria**
- [ ] Bar hidden while the hero or final-CTA panel is in view
- [ ] Slides out on fast downward scroll, returns on upward scroll — transform/opacity only
- [ ] Reduced motion: bar toggles visibility with no slide
- [ ] Zero CLS contribution (verified with the Web Vitals extension)

**Technical notes**
`ScrollTrigger.onUpdate` → `self.direction` in `MobileCtaBar.tsx`; hidden state `translateY(110%)`. Touch scroll is native (Lenis is wheel-only) — ScrollTrigger still tracks it. Gate the scene with `gsap.matchMedia('(max-width: 767px)')` and revert cleanly.

**Dependencies**
Blocked by: #Add static sticky mobile CTA bar below the fold

---

### Title: Add hero scroll cue and CTA micro-interactions
**Labels:** `animation`, `design`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
Tesla's hero shows a bouncing chevron that teaches first-time visitors the page scrolls. Add a scroll cue at the hero's bottom edge that fades out permanently after the first scroll, and finish the CTA pair with hover/press micro-interactions consistent with the app's existing spring conventions.

**Acceptance criteria**
- [ ] Chevron cue appears after the intro splash completes; fades permanently after first scroll or 8s
- [ ] Cue is `aria-hidden` and absent entirely under reduced motion
- [ ] CTA hover/active states ≤150ms, transform/opacity only, matching `active:scale-[0.97]` convention
- [ ] CTA row enters as part of the existing hero timeline — no separate flash after `introDone`

**Technical notes**
Join the `AppShowcase.tsx` entrance timeline (heading-stagger group). Cue bounce = `motion-safe` CSS keyframe in the `globals.css` `@theme` block (Tailwind v4 — no tailwind.config.js) or a GSAP yoyo; kill it on the first Lenis scroll event. Lucide `ChevronDown` icon.

**Dependencies**
Blocked by: #Build hero dual-CTA block with headline and sub-line

---

### Title: Retune pinned Features and FAQ scenes to panel rhythm
**Labels:** `animation`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
With every section now a full-viewport panel, the pinned card-deal (Features) and horizontal FAQ gallery should read as N clean "virtual panels" instead of arbitrary scroll lengths — that regularity is what makes Tesla-style paging feel intentional even through pinned scenes. Retime pin distances and snap increments accordingly.

**Acceptance criteria**
- [ ] FeatureShowcase pin distance ≈ cards × 100vh; each card transition completes within one viewport of scroll
- [ ] FAQ gallery advances whole-card per ~1 viewport of vertical scroll, snap in whole-card increments preserved
- [ ] The "01/06" counter still tracks correctly; below-`lg` scrubbed grid behavior unchanged
- [ ] Reduced-motion and no-JS fallbacks unchanged and re-verified
- [ ] Panel snapping hands off cleanly at pin start/end (no tug-of-war)

**Technical notes**
`FeatureShowcase.tsx`: the desktop matchMedia scene's `end: n*80%` → retune toward 100%. `FaqShowcase.tsx`: `cardAdvance` snap increments; the master tween must keep `ease:'none'` (containerAnimation triggers depend on it). House rule: pin the wrapper, never the animated element. No `clearProps` on scrubbed tweens.

**Dependencies**
Blocked by: #Add desktop panel snapping via ScrollTrigger

---

### Title: Audit animation performance and reduced-motion fallbacks
**Labels:** `animation`, `performance`
**Milestone:** Milestone 2: Motion & animation layer

**Description**
Tesla ships heavy media but keeps interaction at 60fps by animating only compositor-friendly properties. Audit the completed motion layer: transform/opacity-only tweens, `will-change` hygiene, no layout reads in `onUpdate` callbacks, and correct bail-out of every scene under `prefers-reduced-motion`. Run last in the milestone.

**Acceptance criteria**
- [ ] DevTools performance trace of a full-page scroll at 4× CPU throttle shows no dropped-frame clusters >50ms
- [ ] No tween animates layout properties (top/left/width/height/margin)
- [ ] Every scene verified under `prefers-reduced-motion: reduce`: full content visible, zero motion, no hidden-by-default states
- [ ] Lenis skip paths (touch, reduced motion) confirmed; no listeners leak after navigating away from `/`
- [ ] Findings + before/after traces documented in the PR description

**Technical notes**
Follow the `gsap-performance` patterns (batching, avoiding layout thrash). Verify `FeatureShowcase`'s counter stays in a ref (no re-render loop). Every scene must start with `if (reduce) return;` *before* any `gsap.set` that hides content. Check `ScrollTrigger.refresh()` cost after font load.

**Dependencies**
Blocked by: #Add desktop panel snapping via ScrollTrigger, #Add entrance reveals to proof band and pricing panels, #Animate sticky mobile CTA bar on scroll direction, #Add hero scroll cue and CTA micro-interactions, #Retune pinned Features and FAQ scenes to panel rhythm

---

## Milestone 3: Registration flow integration

---

### Title: Build signup modal with Google and email paths
**Labels:** `auth`, `frontend`
**Milestone:** Milestone 3: Registration flow integration

**Description**
Tesla overlays its order flow rather than navigating you away from the page. Build a registration modal for the landing page: primary "Continue with Google" plus an email/password form, reusing the exact Supabase functions that already power `/login`. No new auth logic — this is a presentation layer over existing flows.

**Acceptance criteria**
- [ ] Modal opens over the landing page with the app's Framer convention (AnimatePresence, spring damping 25 / stiffness 350)
- [ ] Google path calls `googleSignIn()`; email path calls `signUpWithEmail(fullName, email, password)` with inline validation errors
- [ ] "Already have an account? Log in" links to `/login`
- [ ] No-JS/crawler fallback: trigger renders as a link to `/login`, progressively enhanced into the modal
- [ ] Deep link `/?signup=1` opens the modal on load (ad/share landable)

**Technical notes**
New `src/components/landing/SignupModal.tsx`. Borrow form logic from `LoginScreen.tsx` (268 lines) — extract shared pieces rather than duplicating validation. Auth functions live only in `src/lib/supabase.ts`. Email confirmation ON ⇒ `data.session` null ⇒ check-inbox state (own issue). Mount inside the provider tree so `useTyme()` works.

**Dependencies**
None within this milestone.

---

### Title: Wire all landing CTAs to signup modal with auth state
**Labels:** `auth`, `frontend`
**Milestone:** Milestone 3: Registration flow integration

**Description**
On Tesla, every panel repeats the same two actions leading to one order flow. Point every primary CTA (hero, pricing, mobile bar, final CTA, header) at the signup modal, and make them auth-aware: signed-in visitors see "Go to app" → `/calendar` instead of a signup prompt.

**Acceptance criteria**
- [ ] All primary CTAs open the same shared SignupModal instance (context or query-param driven)
- [ ] Signed-in users: primary CTAs read "Go to app" and navigate to `/calendar`; the modal never opens for them
- [ ] No wrong-label flash during `authLoading` (skeleton or neutral state)
- [ ] Header button and final CTA band migrated; the old hero `SignInButton` variant retired or repurposed

**Technical notes**
`page.tsx` must stay a server component — add a client `SignupModalProvider` beside `IntroProvider` and have CTA components consume it. `AppNavButton.tsx` already implements the session-aware Login ↔ Go To App pattern — extend it rather than reinventing. Auth state via `useTyme().user/authLoading`.

**Dependencies**
Blocked by: #Build signup modal with Google and email paths, #Build hero dual-CTA block with headline and sub-line

---

### Title: Handle email-confirmation and OAuth return states
**Labels:** `auth`
**Milestone:** Milestone 3: Registration flow integration

**Description**
Registration ends off-page — a Google redirect or a confirmation email — and a Tesla-grade flow never dead-ends. Handle the returns: OAuth lands on `/calendar` (existing redirect), email signup shows a persistent "check your inbox" state inside the modal, and the confirmation link brings users back to a clear next step.

**Acceptance criteria**
- [ ] Email signup with confirmation enabled shows a check-inbox panel in the modal (never a silent close)
- [ ] The `emailRedirectTo` return to `/login` presents a clear "email confirmed — sign in" affordance
- [ ] Cancelled/denied Google consent returns to the landing page with a friendly retry state, not a broken screen
- [ ] New states are AA-contrast and announced via `aria-live`

**Technical notes**
`signUpWithEmail` already signals the confirmation case via `data.session === null`; `LoginScreen.tsx` has the banner pattern to mirror. Reminder from the data layer: every deployment origin **and** `{origin}/calendar` must be registered in Supabase Auth → URL Configuration → Redirect URLs, or OAuth fails on that deployment.

**Dependencies**
Blocked by: #Build signup modal with Google and email paths

---

### Title: Harden signup modal accessibility and mobile layout
**Labels:** `auth`, `frontend`, `design`
**Milestone:** Milestone 3: Registration flow integration

**Description**
The modal is the conversion-critical surface; it must meet WCAG AA and feel native on phones, where a full-width bottom sheet beats a floating dialog. Harden focus management, dialog semantics, scroll locking, and the small-screen layout.

**Acceptance criteria**
- [ ] Focus trapped while open; returns to the invoking CTA on close; sensible initial focus
- [ ] `role="dialog"` + `aria-modal="true"`, labelled by its heading; Esc and backdrop close it
- [ ] <`md`: renders as a full-width bottom sheet with `.pb-safe` padding; inputs ≥44px and ≥16px font (no iOS zoom)
- [ ] Background scroll locked while open (Lenis stop/start), restored on close
- [ ] Axe scan: zero critical issues; a manual screen-reader pass is documented in the PR

**Technical notes**
`lenis.stop()`/`lenis.start()` on open/close; mark background inert (or a focus trap). Framer variants can switch dialog ↔ sheet via matchMedia. Touch targets per house convention (`min-h-[44px]`+).

**Dependencies**
Blocked by: #Wire all landing CTAs to signup modal with auth state

---

## Milestone 4: SEO, analytics & performance (LCP < 2.5s, CLS < 0.1)

---

### Title: Refresh metadata, OG/Twitter cards, and canonical URLs
**Labels:** `seo`, `copy`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Tesla pairs locale-scoped canonicals with product-led titles and share cards that reuse the hero shot. Refresh the `metadata` export to the new copy formula (primary keyword + benefit + free), regenerate the OG image from the actual calendar hero, and replace the placeholder `SITE_URL` when the production domain is settled.

**Acceptance criteria**
- [ ] Title ≤60 chars in the pattern "keyword + benefit + brand"; description ≤155 chars ending in a call to action
- [ ] `og-image.png` regenerated at 1200×630 showing the calendar hero + logo + tagline; `twitter:card` stays `summary_large_image`
- [ ] `SITE_URL` in `src/lib/seo.ts` updated from the `https://tyme.app` placeholder — one change verified to propagate to canonical, sitemap, robots, and all JSON-LD urls
- [ ] Cards render correctly in a social-card debugger (LinkedIn/X/Facebook validators)

**Technical notes**
`src/app/layout.tsx` metadata export; `metadataBase` derives from `SITE_URL`. OG source art: `assets/logo_512.png` + a hero screenshot. If the favicon/OG art changes, bump the `?v=` cache-buster.

**Dependencies**
Blocked by: #Rewrite landing copy in seo.ts using the panel copy formula

---

### Title: Sync JSON-LD and llms.txt with new landing copy
**Labels:** `seo`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Tesla ships per-product structured data; our equivalents are SoftwareApplication + WebSite + FAQPage built from the `seo.ts` arrays. After the copy rewrite and the new panels, verify the JSON-LD still mirrors visible copy exactly, extend `featureList` with any new stat-band facts, and bring `llms.txt` (the AI-answer-engine summary) up to date.

**Acceptance criteria**
- [ ] Rich Results Test passes all three schemas with zero errors or warnings
- [ ] Every JSON-LD claim exists verbatim in visible SSR copy (no drift between schema and page)
- [ ] No fabricated `aggregateRating`/`review` markup introduced
- [ ] `public/llms.txt` describes the new pricing and proof-band facts and matches on-page copy
- [ ] `robots.ts` still disallows `/calendar`, `/reports`, `/settings`; sitemap still lists `/`

**Technical notes**
`structuredData` in `seo.ts` is built from `productFeatures`/`faqItems` — extend the builders, don't fork them. FAQ answers must remain SSR-visible in the `<dd>` elements (rich-results mirror requirement).

**Dependencies**
Blocked by: #Rewrite landing copy in seo.ts using the panel copy formula, #Build stats proof band with monospace numeral tiles

---

### Title: Instrument CTA and signup funnel analytics events
**Labels:** `frontend`, `performance`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Tesla measures every panel's entry into the order flow; we need the same funnel visibility to iterate on conversion. Add Vercel Analytics custom events for each CTA click (tagged with its panel), modal open, signup method chosen, and signup submitted — making per-section drop-off measurable.

**Acceptance criteria**
- [ ] Events: `cta_click {panel, variant}`, `signup_modal_open`, `signup_method {google|email}`, `signup_submitted`, `signup_confirmed_return`
- [ ] Each event fires exactly once per interaction (no double-fire on re-render)
- [ ] No PII in payloads (no emails, names, or tokens)
- [ ] Events verified in the Vercel Analytics dashboard on a preview deployment

**Technical notes**
`@vercel/analytics` is already mounted in the root layout — use `import { track } from '@vercel/analytics'`. The CSP `connect-src` already allowlists Vercel Analytics, so no `next.config.ts` change needed. Call sites: shared CtaButton, SignupModal, confirmation handler.

**Dependencies**
Blocked by: #Wire all landing CTAs to signup modal with auth state

---

### Title: Optimize hero critical path for LCP under 2.5 s
**Labels:** `performance`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Tesla pays a big LCP tax for hero video; we deliberately don't — our hero is DOM-built, so LCP should be cheap. Verify and enforce it: identify the actual LCP element (likely the H1 or the intro-splash overlay), make sure the splash doesn't hijack LCP, and slim the JS shipped to `/` on mobile data.

**Acceptance criteria**
- [ ] Lighthouse mobile (Slow 4G, 4× CPU) on a production build: LCP < 2.5s
- [ ] The LCP element is hero content, not the intro overlay; SSR content paints beneath the splash without delay
- [ ] Below-fold animation islands code-split via `next/dynamic` **with SSR markup preserved** (SEO house rule 3)
- [ ] First-load JS for `/` reduced vs baseline, with before/after route sizes reported in the PR
- [ ] Fonts show no FOIT (next/font self-hosting verified)

**Technical notes**
Careful with `next/dynamic`: keep `ssr: true` so headings/FAQ stay in initial HTML. GSAP + ScrollTrigger + Lenis land in first-load JS today — investigate initializing `SmoothScrollProvider` on idle. The intro splash is a fixed z-9999 overlay: measure whether Chrome selects it as the LCP element and restructure if so. Never run `npm run build` while the dev server is running (both write `.next/`).

**Dependencies**
Blocked by: #Audit animation performance and reduced-motion fallbacks

---

### Title: Eliminate layout shift to hold CLS under 0.1
**Labels:** `performance`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Tesla holds CLS near zero by reserving space for every async asset. Audit the rebuilt page's shift sources — intro-splash unmount, ScrollTrigger pin spacers appearing at hydration, Reveal initial states, the mobile CTA bar, and font swap — and fix each until CLS stays under 0.1 on a full scroll.

**Acceptance criteria**
- [ ] Lighthouse + Web Vitals extension report CLS < 0.1 on mobile and desktop across a full-page scroll
- [ ] Intro splash mount/unmount contributes zero shift (pure overlay)
- [ ] Pinned sections reserve their height before ScrollTrigger initializes (no jump at hydration)
- [ ] Mobile CTA bar and signup modal contribute zero shift (fixed/overlay only)
- [ ] Font-swap shift measured; fallback `size-adjust` tuned if it contributes >0.02

**Technical notes**
Transforms don't count toward CLS — verify `Reveal` initial states use transform/opacity, never margins. ScrollTrigger `pinSpacing` inserts a spacer at init: pre-size pinned sections with CSS `min-height` matching the pin distance so hydration is shift-free. next/font's `adjustFontFallback` is on by default — confirm rather than assume.

**Dependencies**
Blocked by: #Audit animation performance and reduced-motion fallbacks

---

### Title: Add Lighthouse CI performance budget workflow
**Labels:** `performance`
**Milestone:** Milestone 4: SEO, analytics & performance

**Description**
Lock in the Core Web Vitals wins with a regression gate. Add a GitHub Actions workflow that builds the app and runs Lighthouse CI against `/` on every PR, asserting the milestone targets (LCP < 2.5s, CLS < 0.1) plus a JS budget taken from the LCP issue's baseline.

**Acceptance criteria**
- [ ] Workflow builds the app and runs LHCI against `/` on pull requests
- [ ] Assertions (mobile config): LCP ≤ 2500ms, CLS ≤ 0.1, TBT ≤ 300ms, plus a route-JS byte budget
- [ ] A failing budget fails the PR check with a readable report link
- [ ] A short "reading and adjusting budgets" note added to the docs

**Technical notes**
`.github/workflows/lighthouse.yml` + `lighthouserc.json` (`@lhci/cli`, `startServerCommand: npm start` after `next build`). `src/lib/supabase.ts` throws at import without env — provide dummy `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` values in the workflow env. The repo has no CI today — keep it a single job.

**Dependencies**
Blocked by: #Optimize hero critical path for LCP under 2.5 s (budgets need its baseline numbers; scaffolding can start in parallel).

---

## Epic

---

### Title: Epic: Tesla-grade conversion landing page
**Labels:** `design`, `frontend`
**Milestone:** — (spans all four)

**Description**
Tracking issue for the landing-page conversion redesign: adapt tesla.com/en_ph's full-viewport, one-message-per-panel architecture, dual-CTA copy formula, restrained motion, and SEO discipline to Tyme's registration goal. Teardown and decisions live in `docs/landing-conversion-plan.md`. Success = visitors register: every panel carries the same primary action, measured end-to-end, at LCP < 2.5s and CLS < 0.1.

**Milestone 1: Static layout & copy**
- [ ] #Restructure landing into full-viewport conversion panels
- [ ] #Build hero dual-CTA block with headline and sub-line
- [ ] #Rewrite landing copy in seo.ts using the panel copy formula
- [ ] #Build stats proof band with monospace numeral tiles
- [ ] #Build "Free forever" pricing panel with dual CTA
- [ ] #Add static sticky mobile CTA bar below the fold
- [ ] #Normalize heading hierarchy, landmarks, and AA contrast

**Milestone 2: Motion & animation layer**
- [ ] #Add desktop panel snapping via ScrollTrigger
- [ ] #Add entrance reveals to proof band and pricing panels
- [ ] #Animate sticky mobile CTA bar on scroll direction
- [ ] #Add hero scroll cue and CTA micro-interactions
- [ ] #Retune pinned Features and FAQ scenes to panel rhythm
- [ ] #Audit animation performance and reduced-motion fallbacks

**Milestone 3: Registration flow integration**
- [ ] #Build signup modal with Google and email paths
- [ ] #Wire all landing CTAs to signup modal with auth state
- [ ] #Handle email-confirmation and OAuth return states
- [ ] #Harden signup modal accessibility and mobile layout

**Milestone 4: SEO, analytics & performance**
- [ ] #Refresh metadata, OG/Twitter cards, and canonical URLs
- [ ] #Sync JSON-LD and llms.txt with new landing copy
- [ ] #Instrument CTA and signup funnel analytics events
- [ ] #Optimize hero critical path for LCP under 2.5 s
- [ ] #Eliminate layout shift to hold CLS under 0.1
- [ ] #Add Lighthouse CI performance budget workflow

*(When created via `scripts/create-landing-issues.sh`, the `#titles` above are replaced with real `#numbers` automatically.)*
