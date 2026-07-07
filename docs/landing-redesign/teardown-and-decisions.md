# Tesla-Inspired Landing Page — Teardown & Adaptation Decisions

This is research input for the issue plan in `github-issues.md`, not a spec to build directly.
Note: a live fetch of tesla.com/en_ph was blocked by Tesla's bot protection (403) during
research, so the teardown below is grounded in the well-documented, stable pattern language
Tesla uses across all its regional storefronts (same template, locale-swapped copy/pricing),
cross-checked against Tyme's actual current landing page (`src/app/page.tsx`).

## TASK 1 — Teardown of tesla.com regional pattern

**1. Page architecture.** One full-viewport panel per vehicle/product, stacked vertically,
each panel is a complete pitch (image, headline, sub-line, 2 CTAs) with no partial-scroll
states — sections either fully occupy the viewport or clearly hand off to the next. Soft
scroll-snap (not hard CSS `scroll-snap-type: mandatory`, since Tesla lets you scroll past
freely) keeps momentum but doesn't trap the user. Hierarchy is strictly flat: hero (brand
statement) → one panel per model → shared utility panels (Shop, Charging, Discover) →
footer. No sidebar, no breadcrumb, no deep nesting.

**2. Selling technique.** Exactly one product per panel — never two models competing for
attention in the same screen. Copy formula per panel: a short headline (2–5 words, often
just the model name or a single benefit), one sub-line (price-from or a single spec, e.g.
"From ₱X,XXX,XXX" or range/performance number), then **exactly two CTAs**: a primary
commit-style action ("Order Now") and a secondary low-friction action ("Demo Drive" /
"Learn More"). Urgency is implicit (current incentive/price shown inline) rather than
countdown timers or banners. Specs are teased, not explained — detail lives one click away.

**3. UX & interaction.** Nav bar is a slim, mostly-transparent overlay on the hero that gains
a solid/blurred background once you scroll past the first panel — it never disappears.
Mobile collapses the same panel structure to full-bleed vertical cards with CTAs pinned near
the bottom of each panel (thumb reach), rather than floating them mid-screen like desktop.
Load strategy favors a fast-loading hero image first (LCP element), with below-the-fold
imagery lazy-loaded as panels approach the viewport.

**4. Motion design.** Restrained: opacity/translate-Y fade-ins as each panel crosses a
scroll threshold, subtle parallax on hero imagery, no heavy scroll-jacking. Nav background
transition is the most-used micro-animation on the whole page. Video is used sparingly and
only where it earns its cost (a single hero loop, muted, poster-framed so it never blocks
LCP). Easing is short and snappy (150–300ms, ease-out) — nothing sluggish. The lesson: match
motion budget to what's actually persuasive (panel reveal, nav transition), skip motion that
only looks impressive in a portfolio (heavy 3D, scroll-jacked pinning on every section).

**5. Visual language.** Two, maybe three type sizes per breakpoint — a large display weight
for headlines, a small regular weight for sub-lines/body. Generous negative space around
every panel; no panel ever feels dense. Color is almost entirely neutral (black/white/grey)
with the product photography supplying all the color — the brand never competes with the
product for attention.

**6. SEO.** Title tags are short and product/locale-specific; canonical + hreflang per
regional locale path (`/en_ph`, `/en_us`, etc.) to avoid duplicate-content penalties across
near-identical regional pages. Structured data uses `Product`/`Organization` schema. OG tags
mirror the hero image and value prop per locale. The Core Web Vitals trade-off is real: the
imagery-heavy hero panels are the biggest LCP risk on the whole page, which is why the hero
image (never the video) is the priority-loaded asset and everything else defers.

## TASK 2 — Adaptation decisions for Tyme's landing page

Tyme's landing page (`src/app/page.tsx`) already has real infrastructure — GSAP + ScrollTrigger,
Lenis smooth scroll, an intro splash gate, a pinned "card deal" Features section, and a
horizontal FAQ gallery (see `.claude/skills/tyme-landing-animations`). This is a **refinement
pass to Tesla-level discipline**, not a rebuild. Decisions below map directly to Milestones
1–4 in `github-issues.md`.

**Section-by-section wireframe** (mapping existing sections to the Tesla panel discipline):
1. Sticky header — keep, but make the transparent→solid transition Tesla-crisp (already
   partially there; needs a verified scroll-driven background/blur transition).
2. Hero (`AppShowcase`) — enforce headline + one sub-line + exactly 2 CTAs (currently the
   hero leans on the app screenshot; needs a hard content contract, not new build).
3. Features (`FeatureShowcase`) — keep the pinned card-deal mechanic, but treat each pinned
   card as "one feature per panel" (Tesla's one-product-per-section rule).
4. How it works — convert from paragraph steps to 3 short spec-style cards (icon + one line).
5. FAQ (`FaqShowcase`) — keep the horizontal gallery, add snap-per-question + keyboard/swipe
   parity for accessibility.
6. Final CTA band — same 2-CTA discipline as hero (primary: Google sign-in, secondary:
   email/password via `/login`).
7. Footer — unchanged.

**Copy formula per section:** `[2–5 word headline] + [one sub-line, concrete benefit or
number] + [primary CTA] + [secondary CTA]`. No section gets a 3rd CTA or a 0-CTA "just
informational" panel except the FAQ.

**Animations to adopt (simplified for perf):**
- Keep existing GSAP/ScrollTrigger pinning in `FeatureShowcase`, but cap scrub/duration and
  disable pinning under `prefers-reduced-motion` and on small viewports (mirrors Tesla's
  "motion earns its cost" restraint).
- Add the nav transparent→solid scroll transition (Tesla's highest-value micro-animation).
- Skip: heavy parallax, scroll-jacking beyond the existing pinned section, video hero
  backgrounds (Tyme's hero is a product screenshot, not a vehicle — a static, optimized
  `next/image` beats a decorative video for LCP).

**Registration UX (CTA placement, form vs. modal, friction reduction):**
- Primary CTA everywhere = direct Google OAuth (`SignInButton`/`googleSignIn()`) — zero-field
  friction, matches Tesla's single-click "Order Now" commitment action.
- Secondary CTA = email/password, routed through the existing `/login` page's
  signin/register toggle (`LoginScreen`) rather than a new modal — reuses working auth code,
  avoids scope creep, and can be revisited as a slide-in modal only if data shows drop-off.
- Instrument every CTA click (Vercel Analytics custom events) so friction can be measured,
  not guessed.

**SEO plan:**
- Keep `src/lib/seo.ts` as the single source of truth; extend `structuredData[]` with
  `Organization` schema (Tesla-style Product/Organization pairing).
- Verify OG/Twitter image is 1200×630 and mirrors the hero value prop.
- No locale/hreflang work needed (Tyme is single-locale today) — skip that part of the
  Tesla pattern.
- Core Web Vitals budget: **LCP < 2.5s, CLS < 0.1** — treat the hero image as the LCP
  element (prioritize it, per Tesla's own hero-image-over-video lesson) and reserve layout
  space for every GSAP-animated section to kill scroll-jank-induced CLS.
