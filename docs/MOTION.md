# Tyme Motion System

The interaction system for the marketing and auth surfaces. Motion here has one
job: make the product feel precise and physical while *reducing* the effort of
reading the page. Every animation below states its trigger and the user problem
it solves. If a proposed animation can't fill in that second column, it doesn't
ship.

## Principles

1. **The scrollbar is the timeline.** Storytelling beats are scrubbed 1:1 to
   scroll, never autoplayed. The reader sets the pace, can rewind, and is never
   held hostage by a timed sequence.
2. **Motion states a relationship.** Entrances communicate hierarchy (what to
   read first), scrubbed scenes communicate sequence (what follows what),
   hover physics communicate affordance (what is pressable). Decoration alone
   is not a reason.
3. **Transform and opacity only.** Everything animates on the compositor. No
   width/height/top/left tweens, no layout thrash, no scroll listeners
   (ScrollTrigger, IntersectionObserver, and pointer events only).
4. **Feedback is instant, storytelling is unhurried.** Press feedback lands in
   150ms; content entrances take ~600ms; only the once-per-session splash and
   the hero entrance are allowed to be longer.
5. **Every effect has an exit ramp.** `prefers-reduced-motion` collapses all of
   it to a static, fully readable page. Cursor effects only exist for
   `(hover: hover) and (pointer: fine)` devices. All animated content is plain
   SSR markup, so no-JS visitors and crawlers see everything.

## Tokens (`src/lib/motion.ts`)

| Token | Value | Used for |
|---|---|---|
| `DUR.tap` | 150ms | presses, color shifts, toggles |
| `DUR.ui` | 250ms | veils, accordions, badges |
| `DUR.enter` | 600ms | content entrances |
| `DUR.hero` | 1s | the one big landing moment per page |
| `EASE_OUT` | cubic-bezier(0.16, 1, 0.3, 1) | entrances: fast start, soft landing |
| `EASE_IN_OUT` | cubic-bezier(0.77, 0, 0.175, 1) | veils and hand-offs |
| `GSAP_EASE.scrub` | `none` | all scroll-scrubbed tweens (the scrollbar is the ease) |

## Inventory

### Loading sequences

| What | When it appears | Why it improves UX |
|---|---|---|
| Logo splash (pulsing bars, logo flies into the header slot) | First visit per browser session only; repeat visits get a 250ms dissolve (`sessionStorage`) | Sets the brand while fonts/JS warm up, and the fly-to-header teaches where the brand anchor lives. Skipping it on repeat visits respects returning users' time, so the polish never becomes a toll. |
| Button loading states (spinner + "Connecting…" in the pressed button) | While OAuth/email auth is in flight | Feedback appears exactly where the user acted, so they never wonder whether the click registered. |
| Form status reveals (error / confirm banners slide open) | On auth failure or email-confirmation | Height+fade reveal pulls the eye to new information without a jarring layout jump. |

### Page transitions

| What | When it appears | Why it improves UX |
|---|---|---|
| Route veil (brand-dark overlay fades in ~250ms, then navigates) | Leaving the landing page via the Login button | Replaces the hard white-flash cut of a route change with a hand-off that stays inside the scene. Fast enough to never feel like waiting. |
| Login panel arrival (rise + fade + settle, 600ms) | On the login route and the in-app auth gate | The receiving half of the veil: the destination greets you instead of just being there. One element animates; the form itself is usable immediately. |

### Scroll-triggered storytelling

| What | When it appears | Why it improves UX |
|---|---|---|
| Story bridge (pinned sentence illuminates word-by-word) | Between hero and features, scrubbed to scroll | Converts dead scroll into the narrative reason the features matter. Reader-paced: scrolling back un-reads it. |
| Feature card deal (heading pins, cards dealt one at a time, desktop) | Features section on lg+; scrubbed rise reveals below lg | Serializes six features into one focal point at a time instead of a wall of cards. |
| Journey timeline (rail draws, nodes ignite, step cards slide in) | How-it-works section, all sizes | The metaphor is the content: three steps in strict order, so you watch the path from sign-in to invoice get drawn. |
| FAQ horizontal gallery (vertical scroll drives sideways card travel) | FAQ section | Keeps six Q&A cards on one visual shelf; progress feels physical. |
| Final CTA arrival (band scales from receded to full presence) | Last section enters the viewport | A felt "end of the story" that frames sign-up as the resolution. |

### Parallax (depth, not spectacle)

| What | When it appears | Why it improves UX |
|---|---|---|
| Ambient glow blobs drift at ±20-26% of scroll speed, opposite directions | Continuously behind the landing page | Slow-moving background reads as distance; it makes every foreground section feel physically in front of something. |
| Hero exit hand-off (heading accelerates up, product frame lags and recedes) | Scrolling out of the hero | Depth-layered transition that hands the eye to the story bridge instead of the section just sliding off. |
| Floating stat cards ride the hero exit at three different rates | Scrolling out of the hero | The speed difference sells the hero as layered space rather than a flat screenshot. |

### Hover, cursor, and micro-interactions (desktop pointers only where noted)

| What | When it appears | Why it improves UX |
|---|---|---|
| Magnetic CTAs (button leans toward cursor, springs back) | Hero + final "Sign in with Google" (pointer: fine) | There is one conversion action; magnetism makes it the most physically responsive element without adding visual weight. |
| Hero frame pointer-tilt (max ~6°) | After the hero entrance settles (pointer: fine) | Makes the product "screenshot" a tangible object that answers the hand, inviting inspection. |
| Card spotlight (accent glow tracks the cursor inside timeline cards) | How-it-works cards (pointer: fine) | Confirms which card is live under the cursor; CSS-variable cheap, no re-renders. |
| Nav link underline (accent line scales from the left) | Header + footer links | A consistent "this points somewhere" cue; direction implies destination. |
| Header elevation (transparent at top; blur + hairline + shadow once scrolled) | After ~40px of scroll (IntersectionObserver sentinel) | At the top the chrome stays out of the hero; once content moves beneath it, the surface separates so nav stays legible. Color/shadow only, no movement. |
| Button lift + press (hover raises 1px + deepens shadow; active scales 0.97) | All white pill CTAs | Simulates a physical key: raised when touchable, depressed when pressed. 150ms so feedback is felt, not watched. |
| Card hover states (border brighten, FAQ card lift + accent edge) | Feature/FAQ/timeline cards | Marks cards as focusable objects; the working accent stays consistent (#dda67a). |

## Guardrails

- **Reduced motion:** every GSAP scene bails before setting a hidden state;
  Motion components pass `initial={false}`-style fallbacks. Verified: page
  renders complete and static under `prefers-reduced-motion: reduce`.
- **Touch devices:** all cursor effects are gated behind
  `(hover: hover) and (pointer: fine)`. Scrubbed scenes ride native touch
  scroll (Lenis smooths desktop wheel only).
- **Budget:** at most one pinned scene per viewport of travel; one marquee per
  page; one "big" entrance per route. New animations must name the principle
  they serve and the token they use.
