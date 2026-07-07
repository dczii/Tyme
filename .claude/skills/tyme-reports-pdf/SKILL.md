---
name: tyme-reports-pdf
description: How ReportsView.tsx works — filtering, aggregation memos, the on-screen SVG chart, CSV export, the jsPDF "Print Report (PDF)" generator, and the separate hidden browser-print template. Use when changing anything on /reports: report filters, KPI cards, charts, billing amounts, PDF layout/branding, or CSV columns.
---

# Tyme Reports & PDF Export (ReportsView.tsx)

[src/components/ReportsView.tsx](src/components/ReportsView.tsx) (~1,650 lines). Props from [reports/page.tsx](src/app/(app)/reports/page.tsx): `entries, projects, tags, onDeleteEntry, onDuplicateEntry (= handleAddEntry), hourlyRate`.

## There are TWO report renderers — know which one you're editing

1. **`handlePrintPDF()`** (line ~164) — the **real** export behind the "Print Report (PDF)" button. Draws a PDF programmatically with **jsPDF** (A4 portrait, pt units) and `doc.save()`s it. This is what users get.
2. **`#print-pdf-report`** — a `hidden print:block` HTML template at the bottom of the JSX, styled for browser `⌘P` printing (print CSS in globals.css forces white bg). It is NOT wired to any button; it only appears if the user prints the page manually. It duplicates the summary/chart/donuts/ledger in HTML+SVG; its header shows the signed-in user's email (ReportsView reads `user` via `useTyme()` directly — the one prop it doesn't take from the page wrapper).

When asked to "change the PDF", it's almost always #1. Keep both in visual sync if the change is branding-level.

## Filter pipeline

- `datePreset: 'thisWeek'|'lastWeek'|'thisMonth'|'lastMonth'|'allTime'` (default `thisMonth`) → `getPresetDateRange()` from utils.ts (allTime = 2000→2100 sentinel range).
- `filteredEntries` memo: date-range check on the `YYYY-MM-DD` strings (plain string comparison — safe because the format is lexicographic), then project id, tag inclusion, and case-insensitive search over description+tags. Sorted newest date first.
- `handleResetFilters` restores thisMonth + empty filters.
- Note: the `ReportFilter` type in types.ts mentions a `'custom'` preset; the UI never offers it — `customStart/customEnd` state exists but is dead (see tyme-gotchas).

## Aggregation memos (the ones actually rendered)

- `totalMinutes` → KPI card 1 and every "Total:" figure. Amount = `(totalMinutes/60) * hourlyRate`, formatted `toLocaleString('en-US', {minimumFractionDigits: 2})` + " USD".
- `projectAggregates` → per-project minutes/color/name (unassigned → "No Project", slate `#64748b`), sorted desc.
- `descriptionAggregates` → per-description totals with a 10-color palette assigned by insertion order.
- `datesInRange` → continuous day array for the chart X axis (capped at 100 days as a safety); for `allTime` it spans min→max entry date.
- `printChartData` → per-day minutes with `MM/DD` labels — feeds BOTH the on-screen SVG chart and the jsPDF bar chart.
- `printProjectDonutSegments` / `printDescDonutSegments` → SVG arc paths (`describeArc` with the 359.99° full-circle guard) + percentages — used by the hidden print template; the jsPDF path only uses their `mins/color/name`.
- `detailedLedgerGroups` → project → description rollup with tag union — used by the hidden print template's ledger (the jsPDF export **dropped** its ledger in v2.3.1 deliberately: "Trim PDF report: drop redundant ledger").
- `getDisplayMinutes` applies optional 15-min rounding — but `roundingActive` has no UI toggle, so it's always raw minutes today.

## On-screen visuals

KPI cards (Total Hours / Total Amount / Entries Logged) → timeline card (note: this card is intentionally a **different, slate-blue palette** `#11171d`/`#232f3b` replicating a Clockify screenshot — do not "fix" it to espresso) with the date-range `<select>` → detailed table with duplicate (via `onDuplicateEntry`, which strips/regenerates the id in providers) and delete actions. Chart is a hand-rolled `<svg viewBox='0 0 1000 240'>`: y-max = `max(5h, ceil(max*2)/2)`, bars `#dda67a`, x-labels angled -25° and thinned by count (`labelStepInterval`).

## jsPDF export anatomy (handlePrintPDF)

Order on the page: title "Summary report" → hand-drawn 8-bar Tyme logo (rounded rects matching BrandLogo colors, blended-opacity hexes precomputed) + wordmark → date range line (`printDateRangeStr`, `MM/DD/YYYY - MM/DD/YYYY`) → inline metrics ("Total / Billable / Amount" — Billable is just totalMinutes again; there is no billable flag on entries) → bar chart (gridlines every 20%, green `rgb(139,195,74)` bars, labels angled -35°) → "Project" section (color bullets + durations + vector donut) → "Description" section (wrapped text rows, page-break logic at `pageHeight - 60`, donut drawn on the first page only) → footer "Created with Tyme" + page number on every page.

- `drawDonut` renders each segment as ~120 radial triangles per full circle then punches a white inner circle — that's the "smooth vector donut" trick; keep `steps = ceil(pct * 120)` proportional or arcs get faceted.
- Colors must be RGB ints — hex is parsed manually (`parseInt(hex.slice(1,3),16)`). jsPDF has no hex API here.
- Multi-page: only the Description section paginates (`doc.addPage()`, footer drawn before each break). If you add sections below it, replicate the `posY + rowHeight > pageHeight - 60` pattern.
- Fonts: built-in Helvetica only (normal/bold). Custom fonts would need jsPDF VFS embedding — don't, unless asked.
- Filename: `Tyme_Report_{range with underscores}.pdf`; success toast after save.

## CSV export

`exportToCSV(filteredEntries, projects)` in [src/utils.ts](src/utils.ts): columns Date, Description, Project, Client, Start, End, Duration (decimal hours), Tags; downloads via a data-URI anchor as `tyme-report-YYYY-MM-DD.csv`. Free-text cells go through `csvCell()`, which doubles quotes AND neutralizes spreadsheet formula injection (leading `= + - @ \t \r` get a `'` prefix, per OWASP) — route any new text column through it. Both export buttons are disabled when `filteredEntries` is empty.

## Billing model

One flat `hourlyRate` (from profile, default 1) applies to ALL entries — no per-project rates, no billable/non-billable flag. The rate is edited in Settings via `HourlyRateControl` (debounced 500 ms auto-save, $5 stepper, presets 15–150); Reports shows it read-only in the header.
