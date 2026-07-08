#!/usr/bin/env bash
#
# Populate dczii/Tyme with the conversion-landing-page backlog:
# 4 milestones, 7 labels, 23 issues + 1 epic (with real #number cross-links).
#
# Requires: gh CLI authenticated with repo scope  ->  gh auth status
# Usage:    bash scripts/create-landing-issues.sh
#
# Re-run safety: milestones/labels are idempotent; issues are NOT (re-running
# creates duplicates), so run the issue section once.
#
# NOTE: issue bodies use unquoted heredocs so dependency variables expand —
# keep bodies free of backticks and unescaped dollar signs when editing.

set -euo pipefail

REPO="dczii/Tyme"

M1="Milestone 1: Static layout & copy"
M2="Milestone 2: Motion & animation layer"
M3="Milestone 3: Registration flow integration"
M4="Milestone 4: SEO, analytics & performance"

echo "==> Preflight"
gh auth status >/dev/null
gh repo view "$REPO" --json name >/dev/null
echo "    ok: authenticated and $REPO reachable"

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------
echo "==> Milestones"
create_milestone() {
  local title="$1" desc="$2"
  if gh api -X POST "repos/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null 2>&1; then
    echo "    created: $title"
  else
    echo "    exists (skipped): $title"
  fi
}
create_milestone "$M1" "Tesla-style full-viewport panel architecture, dual-CTA copy formula, new proof/pricing sections. Static + SSR only."
create_milestone "$M2" "Panel snapping, entrance reveals, sticky-bar choreography. GSAP/Lenis house rules; reduced-motion bails entirely."
create_milestone "$M3" "Signup modal (Google + email via existing Supabase flows), auth-aware CTAs, return-state handling, WCAG AA."
create_milestone "$M4" "Metadata/OG refresh, JSON-LD + llms.txt sync, funnel analytics, LCP < 2.5s, CLS < 0.1, Lighthouse CI budgets."

# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------
echo "==> Labels"
create_label() { gh label create "$1" -R "$REPO" --color "$2" --description "$3" --force >/dev/null && echo "    $1"; }
create_label frontend    1d76db "Landing page markup, components, layout"
create_label design      cc317c "Visual system, espresso theme, UX polish"
create_label animation   f9a03f "GSAP / ScrollTrigger / Lenis / Framer motion work"
create_label seo         0e8a16 "Metadata, JSON-LD, llms.txt, crawlability"
create_label auth        5319e7 "Supabase auth / registration flow"
create_label performance d93f0b "Core Web Vitals, bundle size, CI budgets"
create_label copy        c5def5 "Headlines, sub-lines, CTA and FAQ copy"

# ---------------------------------------------------------------------------
# Issues — created in dependency order; numbers captured for cross-links
# ---------------------------------------------------------------------------
echo "==> Issues"
create_issue() {
  local title="$1" labels="$2" milestone="$3" url num
  if [ -n "$milestone" ]; then
    url=$(gh issue create -R "$REPO" --title "$title" --label "$labels" --milestone "$milestone" --body-file -)
  else
    url=$(gh issue create -R "$REPO" --title "$title" --label "$labels" --body-file -)
  fi
  num="${url##*/}"
  echo "    created #$num  $title" >&2
  echo "$num"
}

# ============================ MILESTONE 1 ==================================

I01=$(create_issue "Restructure landing into full-viewport conversion panels" "frontend,design" "$M1" <<EOF
### Description
Tesla's regional page is a stack of full-viewport panels, one message each, so every scroll stop has a single job. Restructure 'src/app/page.tsx' so each major section (hero, features, proof-band placeholder, how-it-works, pricing placeholder, FAQ, final CTA) renders as a 'min-h-[100svh]' panel with shared vertical rhythm. Markup/layout only — no new motion; existing GSAP scenes must keep working untouched.

### Acceptance criteria
- [ ] Each top-level section on / fills at least 100svh on desktop and mobile without clipping content or horizontal scroll
- [ ] Existing GSAP scenes (AppShowcase, FeatureShowcase, FaqShowcase) render and animate unchanged
- [ ] Section order: hero, features, proof band (empty shell), how-it-works, pricing (empty shell), FAQ, final CTA
- [ ] No CSS scroll-snap introduced (conflicts with Lenis smooth wheel — snapping arrives in Milestone 2 via ScrollTrigger)
- [ ] 'npm run lint' passes; page reads correctly with JavaScript disabled

### Technical notes
Use 100svh, not 100vh (mobile URL-bar collapse). Keep the SectionComment view-source labels. Pinned scenes (FeatureShowcase pin, FAQ stage) manage their own scroll length — wrap them, never resize them. Espresso tokens per house style (#0c0806 bg, #3e271a borders).

### Dependencies
None.
EOF
)

I03=$(create_issue "Rewrite landing copy in seo.ts using the panel copy formula" "copy,seo" "$M1" <<EOF
### Description
Tesla gives every panel one product, a headline of six words or fewer, and a sub-line that carries a number (price, range). Rewrite all landing copy to that formula: benefit-first headlines, one concrete fact per sub-line, in the established keyword register (time tracking app, freelancers, virtual assistants, billable hours, Clockify alternative). Feature/FAQ copy is edited ONLY in 'src/lib/seo.ts' — it feeds both the visible sections and the JSON-LD.

### Acceptance criteria
- [ ] Every section headline has 6 words or fewer, benefit-first; every sub-line is one sentence with a concrete fact
- [ ] Feature and FAQ copy changed only in seo.ts (no hardcoded strings added to components)
- [ ] Each target keyword appears at least once in visible copy
- [ ] public/llms.txt updated to match (hand-written, not generated)
- [ ] FAQPage/SoftwareApplication JSON-LD (built from the same arrays) validates in Google's Rich Results Test

### Technical notes
seo.ts exports productFeatures[] (title/description/feature) and faqItems[]. Renamed or added FAQ items need matching entries in FAQ_META inside FaqShowcase.tsx (falls back gracefully but tag/icon go generic). FAQ answers must remain SSR-rendered (always-visible dd elements). No fabricated urgency, user counts, or ratings — factual claims only.

### Dependencies
None.
EOF
)

I02=$(create_issue "Build hero dual-CTA block with headline and sub-line" "frontend,copy,design" "$M1" <<EOF
### Description
Tesla's hero is headline + one sub-line carrying the price + exactly two CTAs (Order Now primary, Learn More secondary). Our hero currently has a single Google button. Replace it with the dual pair: primary "Start tracking free" (registration entry) and secondary "See how it works" (anchor to #how-it-works), with a sub-line stating the price fact: "Free for freelancers and VAs. No credit card."

### Acceptance criteria
- [ ] Hero shows exactly two CTAs: primary copper (bg #a66e46, hover #8e5a34) and quiet secondary variant
- [ ] Primary CTA triggers the existing Google OAuth flow for now (modal swap happens in Milestone 3); secondary smooth-scrolls to #how-it-works
- [ ] Sub-line under the H1 states free pricing in 90 chars or fewer
- [ ] Both CTAs have 44px+ touch height, visible focus ring, WCAG AA contrast
- [ ] H1, sub-line, and CTA labels present in SSR HTML (view-source)

### Technical notes
Heading block lives in src/components/landing/scroll/AppShowcase.tsx. Create a shared CtaButton (or extend SignInButton variants) so hero/pricing/final-CTA/mobile-bar reuse one component. Add the CTA row to the existing hero entrance timeline so it staggers in with the heading (gated on introDone). Anchor scroll should route through Lenis (lenis.scrollTo) with native fallback.

### Dependencies
Final copy comes from #$I03 (placeholders fine until then).
EOF
)

I04=$(create_issue "Build stats proof band with monospace numeral tiles" "frontend,design,copy" "$M1" <<EOF
### Description
Tesla panels sell with numbers (range, 0-100 time, price), not adjectives. Add a proof-band panel of 3-4 stat tiles using honest product facts — e.g. "1-click Google sign-in", "2 export formats (PDF + CSV)", "0 pesos forever", "7-day week view" — set in JetBrains Mono numerals per the app's numeral convention.

### Acceptance criteria
- [ ] 3-4 stat tiles: numerals in font-mono accent tan (#dda67a), labels uppercase mono tracking-wider
- [ ] Every stat is a verifiable product fact (no invented user counts or ratings)
- [ ] Responsive: stacked on mobile, single row at md and up; WCAG AA contrast
- [ ] Content SSR-rendered and static (entrance animation is a Milestone 2 issue)

### Technical notes
New src/components/landing/StatsBand.tsx — server component, no "use client". Glass panel house pattern: bg-[#130d0a]/35 backdrop-blur-xl border-[#3e271a]/55 rounded-2xl. Slots into the proof-band shell created by #$I01.

### Dependencies
Blocked by: #$I01
EOF
)

I05=$(create_issue "Build \"Free forever\" pricing panel with dual CTA" "frontend,copy" "$M1" <<EOF
### Description
Tesla puts the price directly under the headline and repeats the same two CTAs on every panel. Our price story is "free" — give it its own panel: headline, one price line, up to 3 included-features bullets, and the same dual CTA pair as the hero. This answers the cost objection before the FAQ has to.

### Acceptance criteria
- [ ] Panel shows headline + "Free forever" price line + up to 3 bullet inclusions
- [ ] Same two CTA components as the hero (primary registration, secondary anchor), identical styling
- [ ] No fabricated urgency or scarcity copy (no countdowns, no limited seats)
- [ ] SSR-rendered; pricing statement consistent with the FAQ answer and the JSON-LD Offer (price 0)

### Technical notes
New section in page.tsx or src/components/landing/PricingPanel.tsx. Reuse the shared CtaButton from #$I02. The SoftwareApplication schema in seo.ts already declares a free Offer — keep visible copy and schema telling the same story.

### Dependencies
Blocked by: #$I01, #$I02
EOF
)

I06=$(create_issue "Add static sticky mobile CTA bar below the fold" "frontend,design" "$M1" <<EOF
### Description
Tesla's mobile page keeps the order/learn CTAs docked at the bottom edge so conversion is never more than one thumb-tap away. Add a fixed bottom CTA bar on viewports under md with the primary CTA plus a compact secondary link. Static in this milestone — scroll-aware show/hide is a Milestone 2 issue.

### Acceptance criteria
- [ ] Bar fixed to the bottom below 768px, absent at md and up
- [ ] Uses the .pb-safe safe-area helper; touch target 44px+; bar height 56px+
- [ ] Primary CTA performs the identical action as the hero primary
- [ ] Bar hidden for signed-in users (auth-aware via useTyme)
- [ ] Zero layout shift: the bar overlays content (fixed), never inserts into flow

### Technical notes
New client component src/components/landing/MobileCtaBar.tsx. z-index above content, below the intro splash (z-9999). Glassmorphism panel per house style. The landing page has no bottom nav (that is the app shell), so no conflict — but verify against globals.css mobile helpers.

### Dependencies
Blocked by: #$I01
EOF
)

I07=$(create_issue "Normalize heading hierarchy, landmarks, and AA contrast" "seo,frontend,design" "$M1" <<EOF
### Description
Tesla keeps a strict single-h1, per-panel-h2 hierarchy that mirrors its nav. Audit the rebuilt page: exactly one h1 (hero), each panel led by an h2, cards/steps as h3; header and footer anchor navs cover all panels; verify WCAG AA contrast across the low-opacity cream text introduced by new sections. Run this last in the milestone.

### Acceptance criteria
- [ ] Exactly one h1; every panel has an h2; no skipped heading levels
- [ ] Header + footer nav link to all anchor targets (features, how-it-works, pricing, faq)
- [ ] All text passes WCAG AA (4.5:1 normal / 3:1 large) — audit #ecd0b9 at /50-/85 opacities on #0c0806 and bump failing values
- [ ] Landmarks: one main, labelled navs, sections tied to headings via aria-labelledby
- [ ] Axe DevTools scan of / shows zero critical violations

### Technical notes
Cream #ecd0b9 below roughly /60 opacity on the espresso background fails AA for body text — check each usage with a contrast tool rather than guessing. Keep SectionComment labels intact. Decorative glow blobs stay aria-hidden + pointer-events-none.

### Dependencies
Blocked by: #$I01, #$I02, #$I04, #$I05, #$I06
EOF
)

# ============================ MILESTONE 2 ==================================

I08=$(create_issue "Add desktop panel snapping via ScrollTrigger" "animation,frontend" "$M2" <<EOF
### Description
Tesla snaps each scroll gesture to the next full-viewport panel. CSS scroll-snap fights Lenis's smooth wheel, so implement snapping with ScrollTrigger's snap on desktop pointer devices only, tuned to feel assistive — a settle, not a hijack.

### Acceptance criteria
- [ ] Wheel scroll settles on panel boundaries for non-pinned panels on lg+ fine-pointer devices
- [ ] Pinned scenes (Features, FAQ) are excluded — snap never fights an active pin
- [ ] Touch devices and prefers-reduced-motion users get native scrolling (no snap)
- [ ] Snap is directional with at most 0.8s ease; the user can always scroll through without being trapped
- [ ] No ScrollTrigger console warnings; ctx.revert() cleans up on unmount

### Technical notes
Extend SmoothScrollProvider.tsx or add a SnapController client component. Gate with gsap.matchMedia for min-width 1024px + prefers-reduced-motion no-preference, plus a pointer-fine check. Compute panel-top offsets in a function with invalidateOnRefresh: true; snap only outside the pinned ranges. Lenis lerp stays 0.1; Lenis smooths wheel only.

### Dependencies
Blocked by: #$I01
EOF
)

I09=$(create_issue "Add entrance reveals to proof band and pricing panels" "animation" "$M2" <<EOF
### Description
Tesla fades panel content up as it enters the viewport. Our lightweight equivalent already exists — the Reveal utility (IntersectionObserver + Framer). Apply staggered reveals to the stat tiles and pricing content, and give the stat numerals a one-shot count-up that respects reduced motion.

### Acceptance criteria
- [ ] Stat tiles and pricing content rise/fade with at most 0.08s stagger on first entry, no re-trigger on scroll-back
- [ ] Numerals count up once (~0.8s) when the band enters; reduced-motion users see final values immediately
- [ ] Content fully visible with JS disabled — animation layers opacity/transform on top of visible SSR markup
- [ ] 'npm run lint' passes; no hydration warnings

### Technical notes
Use Reveal.tsx (rootMargin -12%, 16px rise) before reaching for GSAP — house rule. Count-up: integer tween on a ref in useLayoutEffect, guarded by an early reduced-motion return BEFORE any gsap.set that changes displayed values. Below the fold, so no introDone gate needed.

### Dependencies
Blocked by: #$I04, #$I05
EOF
)

I10=$(create_issue "Animate sticky mobile CTA bar on scroll direction" "animation,frontend" "$M2" <<EOF
### Description
Tesla's docked mobile CTAs get out of the way while you read and return when you pause or reverse. Make the static bar scroll-aware: hidden over the hero and final CTA panels (both already show large CTAs), slides in after the hero, slides away on a downward fling, returns on any upward scroll.

### Acceptance criteria
- [ ] Bar hidden while the hero or final-CTA panel is in view
- [ ] Slides out on fast downward scroll, returns on upward scroll — transform/opacity only
- [ ] Reduced motion: bar toggles visibility with no slide
- [ ] Zero CLS contribution (verified with the Web Vitals extension)

### Technical notes
ScrollTrigger onUpdate -> self.direction in MobileCtaBar.tsx; hidden state translateY(110%). Touch scroll is native (Lenis is wheel-only) — ScrollTrigger still tracks it. Gate the scene with gsap.matchMedia for max-width 767px and revert cleanly.

### Dependencies
Blocked by: #$I06
EOF
)

I11=$(create_issue "Add hero scroll cue and CTA micro-interactions" "animation,design" "$M2" <<EOF
### Description
Tesla's hero shows a bouncing chevron that teaches first-time visitors the page scrolls. Add a scroll cue at the hero's bottom edge that fades out permanently after the first scroll, and finish the CTA pair with hover/press micro-interactions consistent with the app's existing spring conventions.

### Acceptance criteria
- [ ] Chevron cue appears after the intro splash completes; fades permanently after first scroll or 8s
- [ ] Cue is aria-hidden and absent entirely under reduced motion
- [ ] CTA hover/active states at most 150ms, transform/opacity only, matching the active:scale-[0.97] convention
- [ ] CTA row enters as part of the existing hero timeline — no separate flash after introDone

### Technical notes
Join the AppShowcase.tsx entrance timeline (heading-stagger group). Cue bounce = motion-safe CSS keyframe in the globals.css theme block (Tailwind v4 — no tailwind.config.js) or a GSAP yoyo; kill it on the first Lenis scroll event. Lucide ChevronDown icon.

### Dependencies
Blocked by: #$I02
EOF
)

I12=$(create_issue "Retune pinned Features and FAQ scenes to panel rhythm" "animation" "$M2" <<EOF
### Description
With every section now a full-viewport panel, the pinned card-deal (Features) and horizontal FAQ gallery should read as N clean "virtual panels" instead of arbitrary scroll lengths — that regularity is what makes Tesla-style paging feel intentional even through pinned scenes. Retime pin distances and snap increments accordingly.

### Acceptance criteria
- [ ] FeatureShowcase pin distance is roughly cards x 100vh; each card transition completes within one viewport of scroll
- [ ] FAQ gallery advances whole-card per ~1 viewport of vertical scroll, whole-card snap preserved
- [ ] The 01/06 counter still tracks correctly; below-lg scrubbed grid behavior unchanged
- [ ] Reduced-motion and no-JS fallbacks unchanged and re-verified
- [ ] Panel snapping hands off cleanly at pin start/end (no tug-of-war)

### Technical notes
FeatureShowcase.tsx: retune the desktop matchMedia scene's pin length (currently n x 80%). FaqShowcase.tsx: cardAdvance snap increments; the master tween must keep ease 'none' (containerAnimation triggers depend on it). House rule: pin the wrapper, never the animated element. No clearProps on scrubbed tweens.

### Dependencies
Blocked by: #$I08
EOF
)

I13=$(create_issue "Audit animation performance and reduced-motion fallbacks" "animation,performance" "$M2" <<EOF
### Description
Tesla ships heavy media but keeps interaction at 60fps by animating only compositor-friendly properties. Audit the completed motion layer: transform/opacity-only tweens, will-change hygiene, no layout reads in onUpdate callbacks, and correct bail-out of every scene under prefers-reduced-motion. Run last in the milestone.

### Acceptance criteria
- [ ] DevTools performance trace of a full-page scroll at 4x CPU throttle shows no dropped-frame clusters over 50ms
- [ ] No tween animates layout properties (top/left/width/height/margin)
- [ ] Every scene verified under prefers-reduced-motion reduce: full content visible, zero motion, no hidden-by-default states
- [ ] Lenis skip paths (touch, reduced motion) confirmed; no listeners leak after navigating away from /
- [ ] Findings + before/after traces documented in the PR description

### Technical notes
Follow gsap-performance patterns (batching, avoiding layout thrash). Verify FeatureShowcase's counter stays in a ref (no re-render loop). Every scene must start with an early reduced-motion return BEFORE any gsap.set that hides content. Check ScrollTrigger.refresh cost after font load.

### Dependencies
Blocked by: #$I08, #$I09, #$I10, #$I11, #$I12
EOF
)

# ============================ MILESTONE 3 ==================================

I14=$(create_issue "Build signup modal with Google and email paths" "auth,frontend" "$M3" <<EOF
### Description
Tesla overlays its order flow rather than navigating you away from the page. Build a registration modal for the landing page: primary "Continue with Google" plus an email/password form, reusing the exact Supabase functions that already power /login. No new auth logic — this is a presentation layer over existing flows.

### Acceptance criteria
- [ ] Modal opens over the landing page with the app's Framer convention (AnimatePresence, spring damping 25 / stiffness 350)
- [ ] Google path calls googleSignIn(); email path calls signUpWithEmail(fullName, email, password) with inline validation errors
- [ ] "Already have an account? Log in" links to /login
- [ ] No-JS/crawler fallback: trigger renders as a link to /login, progressively enhanced into the modal
- [ ] Deep link /?signup=1 opens the modal on load (ad/share landable)

### Technical notes
New src/components/landing/SignupModal.tsx. Borrow form logic from LoginScreen.tsx — extract shared pieces rather than duplicating validation. Auth functions live only in src/lib/supabase.ts. Email confirmation ON means data.session is null, which shows the check-inbox state (separate issue). Mount inside the provider tree so useTyme works.

### Dependencies
None within this milestone.
EOF
)

I15=$(create_issue "Wire all landing CTAs to signup modal with auth state" "auth,frontend" "$M3" <<EOF
### Description
On Tesla, every panel repeats the same two actions leading to one order flow. Point every primary CTA (hero, pricing, mobile bar, final CTA, header) at the signup modal, and make them auth-aware: signed-in visitors see "Go to app" -> /calendar instead of a signup prompt.

### Acceptance criteria
- [ ] All primary CTAs open the same shared SignupModal instance (context or query-param driven)
- [ ] Signed-in users: primary CTAs read "Go to app" and navigate to /calendar; the modal never opens for them
- [ ] No wrong-label flash during authLoading (skeleton or neutral state)
- [ ] Header button and final CTA band migrated; the old hero SignInButton variant retired or repurposed

### Technical notes
page.tsx must stay a server component — add a client SignupModalProvider beside IntroProvider and have CTA components consume it. AppNavButton.tsx already implements the session-aware Login vs Go To App pattern — extend it rather than reinventing. Auth state via useTyme user/authLoading.

### Dependencies
Blocked by: #$I14, #$I02
EOF
)

I16=$(create_issue "Handle email-confirmation and OAuth return states" "auth" "$M3" <<EOF
### Description
Registration ends off-page — a Google redirect or a confirmation email — and a Tesla-grade flow never dead-ends. Handle the returns: OAuth lands on /calendar (existing redirect), email signup shows a persistent "check your inbox" state inside the modal, and the confirmation link brings users back to a clear next step.

### Acceptance criteria
- [ ] Email signup with confirmation enabled shows a check-inbox panel in the modal (never a silent close)
- [ ] The emailRedirectTo return to /login presents a clear "email confirmed — sign in" affordance
- [ ] Cancelled/denied Google consent returns to the landing page with a friendly retry state, not a broken screen
- [ ] New states are AA-contrast and announced via aria-live

### Technical notes
signUpWithEmail already signals the confirmation case via a null data.session; LoginScreen.tsx has the banner pattern to mirror. Reminder from the data layer: every deployment origin AND origin/calendar must be registered in Supabase Auth -> URL Configuration -> Redirect URLs, or OAuth fails on that deployment.

### Dependencies
Blocked by: #$I14
EOF
)

I17=$(create_issue "Harden signup modal accessibility and mobile layout" "auth,frontend,design" "$M3" <<EOF
### Description
The modal is the conversion-critical surface; it must meet WCAG AA and feel native on phones, where a full-width bottom sheet beats a floating dialog. Harden focus management, dialog semantics, scroll locking, and the small-screen layout.

### Acceptance criteria
- [ ] Focus trapped while open; returns to the invoking CTA on close; sensible initial focus
- [ ] role dialog + aria-modal true, labelled by its heading; Esc and backdrop close it
- [ ] Below md: renders as a full-width bottom sheet with .pb-safe padding; inputs 44px+ tall and 16px+ font (no iOS zoom)
- [ ] Background scroll locked while open (Lenis stop/start), restored on close
- [ ] Axe scan: zero critical issues; a manual screen-reader pass is documented in the PR

### Technical notes
lenis.stop() / lenis.start() on open/close; mark background inert (or use a focus trap). Framer variants can switch dialog vs sheet via matchMedia. Touch targets per house convention (min-h-[44px] and up).

### Dependencies
Blocked by: #$I15
EOF
)

# ============================ MILESTONE 4 ==================================

I18=$(create_issue "Refresh metadata, OG/Twitter cards, and canonical URLs" "seo,copy" "$M4" <<EOF
### Description
Tesla pairs locale-scoped canonicals with product-led titles and share cards that reuse the hero shot. Refresh the metadata export to the new copy formula (primary keyword + benefit + free), regenerate the OG image from the actual calendar hero, and replace the placeholder SITE_URL when the production domain is settled.

### Acceptance criteria
- [ ] Title 60 chars or fewer in the pattern keyword + benefit + brand; description 155 chars or fewer ending in a call to action
- [ ] og-image.png regenerated at 1200x630 showing the calendar hero + logo + tagline; twitter card stays summary_large_image
- [ ] SITE_URL in src/lib/seo.ts updated from the placeholder — one change verified to propagate to canonical, sitemap, robots, and all JSON-LD urls
- [ ] Cards render correctly in social-card debuggers (LinkedIn/X/Facebook validators)

### Technical notes
src/app/layout.tsx metadata export; metadataBase derives from SITE_URL. OG source art: assets/logo_512.png + a hero screenshot. If the favicon/OG art changes, bump the cache-buster query param.

### Dependencies
Blocked by: #$I03
EOF
)

I19=$(create_issue "Sync JSON-LD and llms.txt with new landing copy" "seo" "$M4" <<EOF
### Description
Tesla ships per-product structured data; our equivalents are SoftwareApplication + WebSite + FAQPage built from the seo.ts arrays. After the copy rewrite and the new panels, verify the JSON-LD still mirrors visible copy exactly, extend featureList with any new stat-band facts, and bring llms.txt (the AI-answer-engine summary) up to date.

### Acceptance criteria
- [ ] Rich Results Test passes all three schemas with zero errors or warnings
- [ ] Every JSON-LD claim exists verbatim in visible SSR copy (no drift between schema and page)
- [ ] No fabricated aggregateRating/review markup introduced
- [ ] public/llms.txt describes the new pricing and proof-band facts and matches on-page copy
- [ ] robots.ts still disallows /calendar, /reports, /settings; sitemap still lists /

### Technical notes
structuredData in seo.ts is built from productFeatures/faqItems — extend the builders, do not fork them. FAQ answers must remain SSR-visible in the dd elements (rich-results mirror requirement).

### Dependencies
Blocked by: #$I03, #$I04
EOF
)

I20=$(create_issue "Instrument CTA and signup funnel analytics events" "frontend,performance" "$M4" <<EOF
### Description
Tesla measures every panel's entry into the order flow; we need the same funnel visibility to iterate on conversion. Add Vercel Analytics custom events for each CTA click (tagged with its panel), modal open, signup method chosen, and signup submitted — making per-section drop-off measurable.

### Acceptance criteria
- [ ] Events: cta_click (panel, variant), signup_modal_open, signup_method (google or email), signup_submitted, signup_confirmed_return
- [ ] Each event fires exactly once per interaction (no double-fire on re-render)
- [ ] No PII in payloads (no emails, names, or tokens)
- [ ] Events verified in the Vercel Analytics dashboard on a preview deployment

### Technical notes
The vercel/analytics package is already mounted in the root layout — use its track() export. The CSP connect-src already allowlists Vercel Analytics, so no next.config.ts change needed. Call sites: shared CtaButton, SignupModal, confirmation handler.

### Dependencies
Blocked by: #$I15
EOF
)

I21=$(create_issue "Optimize hero critical path for LCP under 2.5 s" "performance" "$M4" <<EOF
### Description
Tesla pays a big LCP tax for hero video; we deliberately do not — our hero is DOM-built, so LCP should be cheap. Verify and enforce it: identify the actual LCP element (likely the H1 or the intro-splash overlay), make sure the splash does not hijack LCP, and slim the JS shipped to / on mobile data.

### Acceptance criteria
- [ ] Lighthouse mobile (Slow 4G, 4x CPU) on a production build: LCP under 2.5s
- [ ] The LCP element is hero content, not the intro overlay; SSR content paints beneath the splash without delay
- [ ] Below-fold animation islands code-split via next/dynamic WITH SSR markup preserved (SEO house rule)
- [ ] First-load JS for / reduced vs baseline, with before/after route sizes reported in the PR
- [ ] Fonts show no FOIT (next/font self-hosting verified)

### Technical notes
Careful with next/dynamic: keep ssr true so headings/FAQ stay in initial HTML. GSAP + ScrollTrigger + Lenis land in first-load JS today — investigate initializing SmoothScrollProvider on idle. The intro splash is a fixed z-9999 overlay: measure whether Chrome selects it as the LCP element and restructure if so. Never run 'npm run build' while the dev server is running (both write .next/).

### Dependencies
Blocked by: #$I13
EOF
)

I22=$(create_issue "Eliminate layout shift to hold CLS under 0.1" "performance" "$M4" <<EOF
### Description
Tesla holds CLS near zero by reserving space for every async asset. Audit the rebuilt page's shift sources — intro-splash unmount, ScrollTrigger pin spacers appearing at hydration, Reveal initial states, the mobile CTA bar, and font swap — and fix each until CLS stays under 0.1 on a full scroll.

### Acceptance criteria
- [ ] Lighthouse + Web Vitals extension report CLS under 0.1 on mobile and desktop across a full-page scroll
- [ ] Intro splash mount/unmount contributes zero shift (pure overlay)
- [ ] Pinned sections reserve their height before ScrollTrigger initializes (no jump at hydration)
- [ ] Mobile CTA bar and signup modal contribute zero shift (fixed/overlay only)
- [ ] Font-swap shift measured; fallback size-adjust tuned if it contributes over 0.02

### Technical notes
Transforms do not count toward CLS — verify Reveal initial states use transform/opacity, never margins. ScrollTrigger pinSpacing inserts a spacer at init: pre-size pinned sections with CSS min-height matching the pin distance so hydration is shift-free. next/font adjustFontFallback is on by default — confirm rather than assume.

### Dependencies
Blocked by: #$I13
EOF
)

I23=$(create_issue "Add Lighthouse CI performance budget workflow" "performance" "$M4" <<EOF
### Description
Lock in the Core Web Vitals wins with a regression gate. Add a GitHub Actions workflow that builds the app and runs Lighthouse CI against / on every PR, asserting the milestone targets (LCP under 2.5s, CLS under 0.1) plus a JS budget taken from the LCP issue's baseline.

### Acceptance criteria
- [ ] Workflow builds the app and runs LHCI against / on pull requests
- [ ] Assertions (mobile config): LCP at most 2500ms, CLS at most 0.1, TBT at most 300ms, plus a route-JS byte budget
- [ ] A failing budget fails the PR check with a readable report link
- [ ] A short "reading and adjusting budgets" note added to the docs

### Technical notes
Add .github/workflows/lighthouse.yml + lighthouserc.json (lhci CLI; start the built app with npm start after next build). src/lib/supabase.ts throws at import without env — provide dummy NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY values in the workflow env. The repo has no CI today — keep it a single job.

### Dependencies
Blocked by: #$I21 (budgets need its baseline numbers; scaffolding can start in parallel).
EOF
)

# ============================== EPIC =======================================

EPIC=$(create_issue "Epic: Tesla-grade conversion landing page" "design,frontend" "" <<EOF
### Goal
Adapt tesla.com/en_ph's full-viewport, one-message-per-panel architecture, dual-CTA copy formula, restrained motion, and SEO discipline to Tyme's single conversion goal: visitor -> registered user. Teardown + decisions: docs/landing-conversion-plan.md. Targets: every panel carries the same primary action, funnel measured end-to-end, LCP under 2.5s, CLS under 0.1, WCAG AA.

### Milestone 1: Static layout & copy
- [ ] #$I01
- [ ] #$I02
- [ ] #$I03
- [ ] #$I04
- [ ] #$I05
- [ ] #$I06
- [ ] #$I07

### Milestone 2: Motion & animation layer
- [ ] #$I08
- [ ] #$I09
- [ ] #$I10
- [ ] #$I11
- [ ] #$I12
- [ ] #$I13

### Milestone 3: Registration flow integration
- [ ] #$I14
- [ ] #$I15
- [ ] #$I16
- [ ] #$I17

### Milestone 4: SEO, analytics & performance
- [ ] #$I18
- [ ] #$I19
- [ ] #$I20
- [ ] #$I21
- [ ] #$I22
- [ ] #$I23
EOF
)

echo ""
echo "==> Done. 23 issues + epic #$EPIC created in $REPO."
echo "    Epic: https://github.com/$REPO/issues/$EPIC"
