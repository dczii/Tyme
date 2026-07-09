# Lighthouse CI performance budget

The landing page has a Core Web Vitals regression gate (issue #35). On every pull
request, [`.github/workflows/lighthouse.yml`](../.github/workflows/lighthouse.yml)
builds the app, serves it with `npm start`, and runs
[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) against `/` three
times (median result), asserting the Milestone 4 budgets in
[`lighthouserc.json`](../lighthouserc.json).

## What it asserts

Lighthouse runs its **default mobile emulation** (Moto G Power, Slow 4G, 4× CPU
throttling), matching the milestone target environment.

| Metric | Budget | Level |
|---|---|---|
| Largest Contentful Paint (LCP) | ≤ 2500 ms | error (fails PR) |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | error (fails PR) |
| Total Blocking Time (TBT) | ≤ 300 ms | error (fails PR) |
| Script transfer size | ≤ 350 kB | error (fails PR) |
| Performance score | ≥ 0.90 | warn (informational) |

A failing `error` assertion fails the check. Each run prints a report URL
(uploaded to Lighthouse's temporary public storage) in the job log — open it to see
the full trace behind a failure.

## Reading and adjusting budgets

- **The numbers live in one place:** the `ci.assert.assertions` block of
  `lighthouserc.json`. Change a threshold there; nothing else needs touching.
- **The script budget is a ceiling, not a target.** `resource-summary:script:size`
  is the total *transferred* (compressed) JavaScript for `/`. The initial `350000`
  (350 kB) sits above today's baseline with headroom. After the first CI run
  establishes the real transferred size on the runner, tighten it to ~15–20% above
  that number so genuine regressions trip it without flaking on noise. For
  reference, `next build` reports the *uncompressed* First Load JS for `/`
  (~287 kB at the time of writing) — that is a different number from the compressed
  transfer size Lighthouse measures, so do not copy it into the budget directly.
- **Raising a budget is a deliberate act.** If a change legitimately needs more of a
  metric (e.g. a new above-the-fold asset nudges LCP), bump the threshold in the same
  PR and say why in the description, so the budget stays a conscious decision rather
  than a rubber stamp.
- **Flaky metric?** TBT and the performance score are the noisiest on shared CI
  runners. `numberOfRuns: 3` already medians them; if a metric still flakes, prefer
  moving it to `warn` over loosening a Core Web Vitals `error` budget.

## Running it locally

```bash
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
npm run build && npx @lhci/cli@0.14.x autorun
```

`autorun` starts the production server itself (`npm start`), collects the runs, and
prints the pass/fail table plus the report link.
