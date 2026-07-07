---
name: tyme-landing-animations
description: The landing-page animation system — intro splash gating via IntroContext, GSAP + ScrollTrigger + Lenis smooth scroll, the hero entrance, the pinned card-deal Features section, the horizontal-gallery FAQ, and Reveal. Use when changing anything on the marketing page (/), adding scroll or entrance animations, debugging pinning/scrub/reduced-motion issues, or deciding GSAP vs Framer Motion in this repo.
---

# Tyme Landing Animations

The landing page (`/`) is a server component ([src/app/page.tsx](src/app/page.tsx)) composed of client "animation islands" under [src/components/landing/](src/components/landing). House rules first, then the scene-by-scene map.

## House rules (every scene obeys these)

1. **GSAP for scroll/entrance choreography, Framer (`motion/react`) only for micro-interactions.** New scroll work = GSAP + ScrollTrigger. `useReducedMotion()` from motion/react is still the reduced-motion hook of choice even inside GSAP components.
2. **Reduced motion = bail out entirely.** Every scene starts with `if (reduce) return;` BEFORE any `gsap.set` that hides content. The static, fully-visible layout is the no-JS/reduced-motion truth.
3. **SEO is non-negotiable:** headings, feature cards, and FAQ answers are plain SSR markup. Animations only touch `opacity`/`transform` **on top of visible content** — nothing may be hidden by default CSS. If the entrance never runs, the page must read perfectly.
4. **Cleanup:** `gsap.context(...)` scoped to a section ref + `return () => ctx.revert()`; responsive scenes use `gsap.matchMedia()` and `mm.revert()`. Scenes run in `useLayoutEffect`.
5. **Pin the wrapper, never the animated element.** (FeatureShowcase pins `pinRef`, FAQ pins its stage wrapper and translates the track inside.)
6. **Intro gating:** on-load entrances must wait for the splash — read `introDone` from `useIntro()` and prime hidden states with `gsap.set` even before `introDone` so there's no flash.
7. ⚠️ **You cannot visually verify these animations in the Claude preview browser** — the tab is backgrounded and rAF is frozen, so GSAP/Lenis scenes never advance. Verify with `preview_snapshot`/`preview_inspect` for DOM state and reasoning about the code; ask the user to eyeball real motion.

## Scene map

### Intro splash — [LogoIntroAnimation.tsx](src/components/landing/LogoIntroAnimation.tsx) + [IntroContext.tsx](src/components/landing/IntroContext.tsx)
Fixed z-9999 overlay. The 8-bar logo pulses orange via a **CSS `@keyframes`** (`tyme-bar-pulse`, per-bar `animationDelay` cascade — deliberately off the JS thread), holds 800 ms, then Framer flies it (single `transform` string → GPU-composited) into the header's `[data-header-logo]` slot, fades the backdrop, calls `markIntroDone()`. Reduced motion: 600 ms hold + fade only. The BARS array duplicates [BrandLogo.tsx](src/components/BrandLogo.tsx) geometry exactly — change one, change both.

### Smooth scroll — [scroll/SmoothScrollProvider.tsx](src/components/landing/scroll/SmoothScrollProvider.tsx)
Lenis (`lerp: 0.1, smoothWheel`) wrapped around the page; bridged to ScrollTrigger with `lenis.on('scroll', ScrollTrigger.update)` and driven by `gsap.ticker` (`lagSmoothing(0)`). Skipped entirely under reduced motion. Lenis smooths **wheel only** — touch scroll stays native (ScrollTrigger listens to it fine). Only the landing page gets this; never wrap the app routes.

### Hero — [scroll/AppShowcase.tsx](src/components/landing/scroll/AppShowcase.tsx)
The product screenshot IS the hero: a hand-built static mock of the calendar (mock DAYS/ENTRIES data, browser chrome) in a `[perspective:1600px]` stage. On `introDone`, one timeline (`power3.out` defaults): heading children stagger up → frame un-tilts from `rotateX:24` (`power4.out`) → entry blocks stagger `scaleY` from the top → floating accent cards drift in from alternating sides. Overlapping position offsets (`"-=0.55"`) create the premium feel. Entry refs are flattened from the ragged 2D array via a computed `flatIndex`.

### Features — [scroll/FeatureShowcase.tsx](src/components/landing/scroll/FeatureShowcase.tsx)
Data comes from `productFeatures` in [src/lib/seo.ts](src/lib/seo.ts) (see tyme-seo — edit copy THERE). Desktop (`min-width:1024px` matchMedia): section pins for `n*80%`, all cards stacked `position:absolute inset-0`, scrubbed timeline deals card i-1 out (`yPercent:-65, rotation:-7`) as card i deals in; `onUpdate` derives the active index for the "01/06" counter (kept in a ref to avoid re-render loops). Below lg: plain grid; each card gets a small **scrubbed** rise/fade (`start 'top 92%' → end 'top 55%'`, `scrub: true` — scrub, not one-shot, was a deliberate mobile fix in v2.2.4). No `clearProps` on scrubbed tweens — the scrub must own the value.

### FAQ — [scroll/FaqShowcase.tsx](src/components/landing/scroll/FaqShowcase.tsx)
The most intricate scene (modelled on GSAP's horizontal-scrolling-gallery demo). Ingredients:
- Decorative marquee `<h2 aria-hidden>` band, two copies translated `xPercent:-50` scrubbed over its own viewport transit (triggered on the marquee, NOT the section, so pin-spacing doesn't stretch it); edge-fade via CSS mask.
- Self-drawing "tentacle" SVG path (strokeDash draw-on, one-shot `once: true` timeline with header rise).
- The gallery: a `<dl>` track that is natively an overflow-x scroll-snap carousel (the reduced-motion/no-JS truth, with prev/next buttons that only show under `motion-reduce:flex`). With motion enabled, a `matchMedia('(min-width: 0px)')` scene takes over: `gsap.set(track, {overflow:'visible', scrollSnapType:'none'})`, pins the stage, and a single `ease:'none'` tween maps vertical scroll to `x: -(scrollWidth - innerWidth)`, with `snap` computed in whole-card increments (`cardAdvance = card width + column gap`), `invalidateOnRefresh: true`.
- Per-card reveals ride `containerAnimation: scrollTween` (positions like `start:'left 92%'` are HORIZONTAL). They animate the inner `[data-faq-reveal]` layer and parallax the `[data-faq-band]` gradient — **never the card root**, so GSAP's inline transform can't clobber the CSS hover lift.
- `ease:'none'` on the master tween is REQUIRED for containerAnimation triggers to line up.
- Card copy comes verbatim from `faqItems` in seo.ts; per-card tag/icon meta is local `FAQ_META` (single accent `#dda67a` on purpose — "Color Consistency Lock").

### Reveal — [Reveal.tsx](src/components/landing/Reveal.tsx)
The lightweight utility for simple sections (How-it-works steps, final CTA): IntersectionObserver (`rootMargin: '-12% 0px'`) + `introDone` gate + Framer fade/rise (16px, `[0.16,1,0.3,1]`, optional `delay` for stagger). Use this before writing a new GSAP scene for a basic fade-in.

### Static niceties in page.tsx
`SectionComment` emits REAL HTML comments (JSX comments are stripped at build) so View-Source shows section labels. Ambient glow blobs are `motion-safe:animate-pulse`. CTA buttons: [SignInButton.tsx](src/components/landing/SignInButton.tsx) (starts Google OAuth; auto-redirects signed-in visitors to /calendar) and [AppNavButton.tsx](src/components/landing/AppNavButton.tsx) (Login ↔ Go To App depending on session).

## Reference material

`faq-card-demo.html` at the repo root is a standalone GSAP scratch demo (CDN scripts) used while prototyping — not shipped. The `.agents/skills/gsap-*` skills (symlinked into `.claude/skills/`) are the official GSAP API references; lean on `gsap-scrolltrigger` for trigger syntax questions.
