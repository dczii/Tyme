# Landing Page Conversion Redesign — Plan

Product: **Tyme** — a free time-tracking app for freelancers and virtual assistants (Clockify alternative).
Goal of `/`: convert visitors into registered users. Reference: Tesla's regional site (tesla.com/en_ph) — polish and persuasion, not a clone.

Companion files:
- [landing-conversion-issues.md](landing-conversion-issues.md) — the full issue backlog, one markdown block per issue
- [../scripts/create-landing-issues.sh](../scripts/create-landing-issues.sh) — one-shot `gh` script that creates milestones, labels, all issues, and a wired epic

---

## Task 1 — Teardown: tesla.com/en_ph

> Note: tesla.com is blocked from this build environment (bot protection + network policy), so this teardown is from the well-documented and long-stable Tesla regional page pattern rather than a live fetch. The pattern has been consistent across regional sites for years.

**1. Page architecture.** A vertical stack of full-viewport panels, one per product (Model 3 → Model Y → … → Solar/Powerwall → Accessories), ending in a compact footer. Each panel is a self-contained pitch; scroll position acts as a product index. Desktop scroll snaps panel-to-panel (historically CSS `scroll-snap-type: y mandatory` / JS-assisted), so every scroll stop is a composed frame: headline top-center, CTAs bottom-center, product filling the frame. Information hierarchy is ruthless: brand nav (thin, transparent) → product name → one qualifier line → imagery → two CTAs. Nothing else competes.

**2. Selling technique.** One product per section, never two. Copy formula per panel: product name as headline (2–3 words), one sub-line carrying a *number* (price "From ₱X,XXX,XXX", range, 0-100 km/h, or a financing/leasing rate), then **exactly two CTAs**: high-commitment primary ("Order Now" / "Custom Order") and low-commitment secondary ("Learn More" / "Test Drive"). Urgency is factual, not theatrical — delivery estimates and tax-credit deadlines, no countdown timers. Specs appear as 3-up numeral rows (range / top speed / 0-100) — numbers sell, adjectives don't.

**3. UX & interaction.** Transparent nav over the hero that gains a solid background on scroll; nav collapses to a hamburger + persistent CTA on mobile. On mobile the two CTAs dock near the bottom edge of each panel — conversion is always one thumb-tap away. The order flow opens as an overlay/configurator rather than losing your place. Images ship as art-directed responsive sources (different crops per breakpoint); below-fold panels lazy-load.

**4. Motion design.** Restraint is the signature: panel content fades/rises ~20px on entry (~500ms, ease-out), imagery is static or a muted autoplaying video only on the hero, subtle parallax between text and product layers on desktop only. No scroll-jacking beyond the snap. Worth the cost: snap paging, entrance fades, docked-CTA show/hide. Not worth it for us: video backgrounds (bandwidth + our CSP), multi-layer parallax on mobile (jank on mid-tier devices).

**5. Visual language.** Two typefaces max (Gotham SSm family), tight scale: giant product name, small everything else. Near-monochrome palette — white/black/greys — so the product photography *is* the color. Extreme whitespace; buttons are quiet (translucent white / outlined) so the imagery stays dominant. The polish comes from consistency: every panel follows the identical grid, so the page reads as one system.

**6. SEO.** Title pattern `Tesla | Electric Cars, Solar & Clean Energy` with locale-scoped canonical (`/en_ph` regional URL strategy, hreflang between locales). One `h1`, per-panel `h2`s. Product/Organization JSON-LD; OG/Twitter cards reuse hero imagery per locale. The trade-off they accept: heavy hero media hurts LCP and they compensate with aggressive CDN/preload work. Lesson for us: we get Tesla's look with a DOM-built hero (no hero image at all), so we can hit LCP < 2.5s *cheaply* — that's our unfair advantage.

---

## Task 2 — Adaptation decisions (one page)

**Section-by-section wireframe** (each a full-viewport `min-h-[100svh]` panel; existing components in parens):

| # | Panel | Content | CTAs |
|---|-------|---------|------|
| 1 | Hero (`AppShowcase`) | H1 ≤6 words + sub-line "Free for freelancers & VAs. No credit card." + 3D calendar mock | **Start tracking free** / See how it works |
| 2 | Features (`FeatureShowcase`) | Pinned card-deal, one feature per "virtual panel" (kept — it already implements Tesla's one-thing-at-a-time rule) | — (in-scene) |
| 3 | Proof band (new `StatsBand`) | 3–4 honest mono-numeral stats (1-click sign-in, 2 export formats, ₱0 forever, 7-day view) | — |
| 4 | How it works (existing) | 3 steps, compressed to panel height | — |
| 5 | Pricing (new) | "Free forever" + price line + 3 inclusions | **Start tracking free** / Explore features |
| 6 | FAQ (`FaqShowcase`) | Horizontal gallery (kept; answers stay SSR for rich results) | — |
| 7 | Final CTA (existing band) | Closing headline + dual CTA | **Start tracking free** / Log in |

Plus: sticky **mobile CTA bar** (Tesla's docked buttons), hidden over hero/final CTA.

**Copy formula per panel:** headline ≤6 words, benefit-first; one sub-line carrying a concrete fact (the "number"); exactly two CTAs — primary = registration, secondary = low-commitment anchor. All copy lives in `src/lib/seo.ts` (single source shared with JSON-LD) in the existing keyword register: *time tracking app, freelancers, virtual assistants, billable hours, Clockify alternative*. No fabricated urgency, user counts, or ratings.

**Animations adopted (simplified):** ScrollTrigger-based panel snapping on desktop pointer devices only (CSS scroll-snap conflicts with Lenis — snap via GSAP instead, excluded around pinned scenes, disabled for touch/reduced-motion); entrance rise/fades via the existing `Reveal` utility; one-shot numeral count-up in the proof band; scroll-direction-aware mobile CTA bar; hero scroll cue. **Rejected:** video backgrounds, mobile parallax, any scroll-jacking that traps the user. All house rules hold: reduced motion bails entirely, SSR markup stays fully visible, transform/opacity only.

**Registration UX:** every primary CTA opens a **signup modal** over the page (Tesla keeps you in scroll context) — "Continue with Google" (existing `googleSignIn()`) + email/password (existing `signUpWithEmail()`), reusing `LoginScreen` logic, deep-linkable via `/?signup=1`, no-JS fallback to `/login`. Friction reduction: no credit card + free-forever microcopy at point of click, one-click Google as the fast path, auth-aware CTAs ("Go to app" for signed-in visitors), bottom-sheet layout on mobile, check-inbox state for email confirmation. Post-signup lands on `/calendar` (existing redirect).

**SEO plan:** keep `seo.ts` as single source of truth; title ≤60 chars keyword+benefit+free; description ≤155 chars ending in a CTA; regenerate `og-image.png` (1200×630) from the calendar hero; replace placeholder `SITE_URL` at launch; JSON-LD stays SoftwareApplication (Offer price 0) + WebSite + FAQPage mirrored from visible copy; `llms.txt` synced; robots keep app routes out of the index. Core Web Vitals: LCP < 2.5s (DOM hero, defer below-fold islands, watch the intro splash), CLS < 0.1 (pre-size pinned sections, overlay-only bars/modals), enforced by a Lighthouse CI budget workflow.

---

## Task 3 — Issue index

24 issues (23 + epic), each ≤2 days. Full bodies in [landing-conversion-issues.md](landing-conversion-issues.md).

### Milestone 1: Static layout & copy
1. Restructure landing into full-viewport conversion panels — `frontend, design`
2. Build hero dual-CTA block with headline and sub-line — `frontend, copy, design`
3. Rewrite landing copy in seo.ts using the panel copy formula — `copy, seo`
4. Build stats proof band with monospace numeral tiles — `frontend, design, copy`
5. Build "Free forever" pricing panel with dual CTA — `frontend, copy`
6. Add static sticky mobile CTA bar below the fold — `frontend, design`
7. Normalize heading hierarchy, landmarks, and AA contrast — `seo, frontend, design`

### Milestone 2: Motion & animation layer
8. Add desktop panel snapping via ScrollTrigger — `animation, frontend`
9. Add entrance reveals to proof band and pricing panels — `animation`
10. Animate sticky mobile CTA bar on scroll direction — `animation, frontend`
11. Add hero scroll cue and CTA micro-interactions — `animation, design`
12. Retune pinned Features and FAQ scenes to panel rhythm — `animation`
13. Audit animation performance and reduced-motion fallbacks — `animation, performance`

### Milestone 3: Registration flow integration
14. Build signup modal with Google and email paths — `auth, frontend`
15. Wire all landing CTAs to signup modal with auth state — `auth, frontend`
16. Handle email-confirmation and OAuth return states — `auth`
17. Harden signup modal accessibility and mobile layout — `auth, frontend, design`

### Milestone 4: SEO, analytics & performance (LCP < 2.5s, CLS < 0.1)
18. Refresh metadata, OG/Twitter cards, and canonical URLs — `seo, copy`
19. Sync JSON-LD and llms.txt with new landing copy — `seo`
20. Instrument CTA and signup funnel analytics events — `frontend, performance`
21. Optimize hero critical path for LCP under 2.5 s — `performance`
22. Eliminate layout shift to hold CLS under 0.1 — `performance`
23. Add Lighthouse CI performance budget workflow — `performance`

### Epic
24. Epic: Tesla-grade conversion landing page — `design, frontend`
