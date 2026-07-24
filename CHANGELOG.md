# Changelog

All notable changes to Tyme are documented here. Versions match the
`version` field in `package.json` (shown live in the app's sidebar footer).

## [2.8.5] — 2026-07-24

### Fixed
- **Mobile landing page crash.** The docked mobile CTA bar (`MobileCtaBar`,
  rendered only on `<md` viewports) threw
  `ReferenceError: Cannot access 'zoneTriggers' before initialization` on load.
  `ScrollTrigger.create()` fires `onToggle` synchronously for any hide-zone
  already on screen at load (the hero is), and that callback read the
  `zoneTriggers` binding while it was still in its temporal dead zone — the
  error propagated through GSAP's ScrollTrigger refresh and broke the bar's
  scroll-based show/hide logic. Fixed by hoisting the binding (`let`, seeded to
  `[]`) so the synchronous callback reads an empty array; the true initial
  state is primed immediately after the triggers are created.

### Housekeeping
- Bumped version to 2.8.5 and resynced the drifted `package-lock.json`.
- Verified on a mobile browser profile (iPhone 13) — no page errors after the
  fix. `tsc --noEmit` clean; production `next build` succeeds.
