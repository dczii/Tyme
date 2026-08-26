# Changelog

All notable changes to Tyme are documented here. Versions match the
`version` field in `package.json` (shown live in the app's sidebar footer).

## [2.10.0] — 2026-08-26

### Added

- **Date range picker on `/reports`.** The plain preset `<select>` is replaced by a
  popover: a quick-range list on the left and a two-month, Monday-first calendar on
  the right for picking an arbitrary start and end date. Click a start day, hover to
  preview the span, click an end day, Apply. Hand-rolled — no new dependencies.
- **Two new quick ranges**, `Last 7 Days` and `Last 30 Days`, alongside the existing
  this/last week, this/last month and all-records options.
- The trigger button now reports the **resolved** span and its length
  (`Aug 1 – Aug 31, 2026 · 31 days`) rather than just the name of a preset.

### Changed

- **Custom ranges are wired end to end.** `customStart`/`customEnd` existed in state
  but nothing read them; a new `activeRange` memo is now the single source of truth
  for the entry filter, the chart X axis, the PDF header and filename, and the CSV
  export. `resolveDateRange()` in `utils.ts` resolves a preset or an explicit custom
  range through one path, normalizing an inverted pick.
- Chart X-axis labels thin proportionally to the number of days (at most ~22 labels)
  instead of capping at every fourth one.
- The chart card lost its `overflow-hidden` — which clipped the popover — and rounds
  its children's corners instead.

### Fixed

- `datesInRange` capped at 100 days, which would have silently truncated the chart
  for any custom range longer than that. Raised to 366.

### Accessibility

- The popover is a labelled `dialog` with `aria-haspopup`/`aria-expanded` on its
  trigger, dismisses on outside click and `Escape`, honours `prefers-reduced-motion`
  via `useReducedMotion`, and keeps a ≥44px trigger. Under `md:` it collapses to a
  single month with a horizontally scrollable preset row.

## [2.9.0] — 2026-07-24

### Added

- **Feedback & survey screen (`/feedback`).** A new auth-gated screen where users
  send one of two things — never both:
  - **A review**: a 1–5 star rating plus optional written thoughts.
  - **Features they'd pay for**: a multi-select of ten roadmap candidates, a
    free-text wish, and a monthly willingness-to-pay band.

  Step 1 shows the reply-to name and email read-only (they come from the signed-in
  account) and takes the choice of branch; step 2 is the branch itself. The server
  re-derives both identity fields from the auth token and ignores whatever the
  request body claims, so the reply address cannot be redirected by a hand-rolled
  request.

- **`POST /api/feedback`** — the first and only server-side code in the app. It
  emails each submission to `FEEDBACK_TO_EMAIL` (default `dczii@live.com`) via
  Resend, with the submitter's address as `reply-to`. Requires a valid Supabase
  access token and re-validates the payload, so it can't be used as an open mail
  relay. Same-origin, so the CSP needed no change.
- **`feedback` nav entry** in the desktop sidebar and the mobile bottom bar. The
  mobile bar now carries five items, so per-button width dropped from
  `min-w-[64px]`/`px-4` to `min-w-[56px]`/`px-2` — verified no overflow at 320px
  with touch targets still ≥56×64px.

### Design decisions

- **Submissions are not stored.** Email is the only sink: no `feedback` table, no
  new RLS surface, no schema to keep in sync. The trade is deliberate — it costs
  aggregate reporting (count your inbox, not a `group by`) and means a failed send
  loses the response. In exchange it removes an entire storage attack surface
  (forged `created_at`, unbounded inserts, client/DB validation drift) and the
  manual "run this SQL before the feature works" step.
- Because nothing is persisted, **a failed send is reported as a failure**: the
  form stays filled with an error toast prompting a retry, rather than showing a
  thank-you screen for a message that never left.

### Hardened

Findings from an independent `grok-4.5` review pass, triaged and fixed:

- **Double-submit race.** The guard was React state, so two clicks in the same
  tick both passed it. Now a `useRef` lock that flips synchronously; verified two
  synchronous clicks produce exactly one POST.
- **Reply-to hijack.** The caller supplied `email`, which was passed to Resend as
  `reply_to` unvalidated — a hostile client could point the owner's "Reply" at any
  address. Closed at the root: identity now comes from the verified token and the
  request body is never consulted for it.
- **Route/UI validation drift.** The route accepted a `features` submission with
  no price band while the UI required one. Both now enforce the same rules.
- **Accessibility.** Exclusive choices (send type, star rating, price band) were
  independent `aria-pressed` toggles, which screen readers announce as unrelated
  buttons. They are now proper `radiogroup`/`radio` with `aria-checked`, roving
  tabindex, and arrow-key selection; feature cards are `role="checkbox"` in a
  labelled group; the email error is tied to its input via `aria-describedby`; and
  the rating label now responds to focus, not just hover.
- **Known gap, not fixed:** `/api/feedback` is not rate-limited — an authenticated
  user can trigger repeat sends. Acceptable while sign-up is the throttle;
  documented in [security_spec.md](security_spec.md) §1.

### Notes

- Requires `RESEND_API_KEY` (server-only — no `NEXT_PUBLIC_` prefix). Optional:
  `FEEDBACK_TO_EMAIL`, `FEEDBACK_FROM_EMAIL`. The default sender
  `feedback@tymeapp.space` is Resend's sandbox address and will only deliver to the
  email that owns the Resend account; set `FEEDBACK_FROM_EMAIL` to an address on a
  verified domain to reach anyone else.
- Verified: `tsc --noEmit` clean; both branches driven in-browser; route probed for
  401/400/200; mobile nav checked at 320px.

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
