---
name: tyme-calendar
description: Internals of CalendarView.tsx (2,200 lines) — grid geometry, the persistent live timer, desktop and mobile drag-and-drop, overlap detection, week picker, and entry modals. Use when changing anything on the /calendar screen: time entries, the timer bar, drag behavior, the weekly grid, day tabs, or the create/edit entry dialogs.
---

# Tyme Calendar (CalendarView.tsx)

[src/components/CalendarView.tsx](src/components/CalendarView.tsx) is the largest file in the repo (~2,190 lines), one component. It receives everything as props from [calendar/page.tsx](src/app/(app)/calendar/page.tsx) → `useTyme()`. Layout order inside the JSX: (1) header w/ week nav + range picker, (2) timer bar, (3) calendar content (mobile day view + desktop grid), (4) edit modal, (5) create modal.

## Grid geometry (desktop)

```ts
const HOURS = Array.from({length: 18}, (_, i) => i + 6); // 06:00–23:00 visible window
const ROW_HEIGHT = 56;  // px per hour
```
- Entry blocks are absolutely positioned: `top = (startDecimal - 6) * 56`, `height = max(28, duration_hours * 56)` — see `getEntryPositionStyles`. Entries outside 6–24h are **cropped to the visible window** (an 02:00 entry renders squashed at the top).
- The grid body is `HOURS.length * ROW_HEIGHT` tall; hour rows are background layers with a 44px (mobile)/60px (md+) hour-label column; day columns are a 7-col grid overlaid absolutely (`left-[44px] md:left-[60px]`), blocks `pointer-events-auto` inside a `pointer-events-none` layer.
- Clicking an empty slot (`handleSlotClicked`) opens the create modal pre-filled with that day + `hh:00–hh+1:00`.
- If you change the visible window or row height, drag math (`yPositionToTime`, `handleGridDragOver`, `getGhostStyles`) uses the same constants — they all stay consistent automatically, but the hour-column width (44/60px) is **duplicated as a magic number** in `handleGridDragOver` and the ghost renderer; keep them in sync with the CSS.

## Live timer (persists across reloads)

State lives in component state, mirrored to localStorage on every change:

| Key | Content |
|---|---|
| `tyme_timer_is_tracking` | 'true'/'false' |
| `tyme_timer_desc` | description string |
| `tyme_timer_proj_id` | selected project id (currently cosmetic — see gotcha) |
| `tyme_timer_tags` | JSON array of tag names |
| `tyme_timer_start_time` | ISO date string |

- Initialized lazily with `typeof window === 'undefined'` guards (SSR-safe). Elapsed seconds are recomputed from `timerStartTime` every second — so a reload resumes the correct elapsed time.
- `handleStartTimer` requires a non-empty description (toast error otherwise).
- `handleStopTimer` creates the entry: date = **today**, `projectId: timerProjId || undefined`, duration min 1 minute, then resets description/tags — the **project selection is intentionally kept** for the next session.
- The timer bar's project pill is a live dropdown (select project / No Project / inline create form using `PROJECT_COLORS` from src/constants.ts).
- Logout (providers.tsx) removes all five keys.

## Drag-and-drop

**Desktop (HTML5 DnD):** blocks are `draggable`; `handleEntryDragStart` swaps the browser drag image for a 1px transparent div so the custom ghost shows instead. `handleGridDragOver` converts cursor x/y → `{dayIndex, startHour}` **snapped to 15 minutes**; a dashed ghost previews target `HH:MM–HH:MM`. `handleGridDrop` rewrites date/startTime/endTime keeping duration, only calls `onUpdateEntry` if something changed, toasts "Entry moved". Escape cancels a drag.

**Mobile (touch):** long-press 400 ms starts the drag (>10px movement before the timer fires cancels it — that's a scroll). A floating card follows the finger; dragging **over a day tab** highlights/switches it via `[data-day-tab-index]` hit-testing; releasing moves the entry to `formattedWeekDays[activeDayIndex]` (date only, times unchanged).

## Overlap detection

`checkHasOverlap(entry)`: same-day entries intersect when `startA < endB && startB < endA` (decimal hours). Overlapping blocks get a red border + "Overlap" badge. Purely visual — overlaps are allowed, never blocked.

## Week navigation & range picker

- Week state = `currentWeekMonday` (a Date); `getWeekDays` derives the 7 days; `formattedWeekDays` are the YYYY-MM-DD strings everything keys on.
- The dual-month popover (`renderCalendarMonth`, 42-cell grids, Monday-first padding) enforces selecting **exactly 7 days**: first click = range start, second click must land 7 days inclusive away, else toast error and restart from the clicked date. Presets: This week / Last week; header buttons: Today's Week, prev/next chevrons.
- ⚠️ A valid 7-day pick sets `currentWeekMonday = start` even if start is NOT a Monday — the "week" then runs e.g. Wed→Tue. Everything renders fine, but preset-active highlighting (`toDateString()` comparisons vs `getMonday(...)`) won't match. Known quirk, don't be surprised by it.
- Mobile keeps `activeDayIndex` (0–6) for the day tabs; `jumpToToday` re-syncs it.

## Modals

Both use `AnimatePresence` + spring (`damping 25, stiffness 350`), close on backdrop click and Escape.

- **Edit modal** (`editingEntry` state, opened by clicking a block/card): edits a local copy; Apply calls `onUpdateEntry`, Delete calls `onDeleteEntry`. Duration field is a free-text `H:MM` **or decimal hours** input (`parseDurationStringToMinutes` accepts `1:30` and `1.5`) — editing duration recomputes endTime via `addMinutesToTime` (wraps at midnight, `% 1440`); editing start/end recomputes duration (`calculateDurationMinutes` treats end<start as overnight, +24h).
- **Create modal** (`isCreateModalOpen`, opened by slot click or the mobile FAB): form via `FormData` for description; project via a real dropdown (`modalProjId` state, defaults to `projects[0]`, includes "No Project" and an inline create form — `handleCreateProjectInModal` is a plain click handler, NOT a nested `<form>`, because the modal already lives inside one); tags via checkbox dropdown (`modalSelectedTags`). Description is `required` here (defaults to "Untitled Task" if somehow empty), unlike edit where it can be blank.

## Mobile layout (< md)

Day-tab strip (7 buttons: weekday, date, daily total badge; today tinted) → sorted entry cards for the active day → empty state → FAB (`bottom-20 right-6`) that opens the create modal for the active day. The whole app also gains a fixed bottom nav from Sidebar, so keep `bottom-20`+ for floating elements.

## Editing rules of thumb

- All duration/time math helpers already exist at the top of the file and in `src/utils.ts` — never re-derive HH:MM parsing inline.
- Daily/weekly totals (`getDailyTotalMinutes`, `getWeeklyTotalMinutes`) filter the raw `entries` prop each render; the 480-minute (8h) desktop header badge threshold is hardcoded, independent of the user's `workdayTargetHours` setting (candidate improvement).
- Anything that creates entries must produce the exact `TimeEntry` shape — `date: 'YYYY-MM-DD'`, times `'HH:MM'` 24h, integer `durationMinutes`.
