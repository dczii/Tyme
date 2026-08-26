"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DateRangePreset,
  formatDateYYYYMMDD,
  getPresetDateRange,
  resolveDateRange,
} from "../utils";

export type DateRangeSelection = DateRangePreset | "custom";

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "allTime", label: "All Records" },
];

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Monday-first grid for one month, padded with nulls so every row holds 7 cells.
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Sun=0 -> 6, Mon=1 -> 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function parseDateStr(value: string): Date {
  return new Date(value + "T00:00:00");
}

// "Aug 7, 2026" / "Aug 1 – Aug 31, 2026" / "Dec 28, 2025 – Jan 3, 2026"
function formatRangeLabel(minDateStr: string, maxDateStr: string): string {
  const start = parseDateStr(minDateStr);
  const end = parseDateStr(maxDateStr);
  const short = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const full = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (minDateStr === maxDateStr) return full(start);
  if (start.getFullYear() === end.getFullYear()) return `${short(start)} – ${full(end)}`;
  return `${full(start)} – ${full(end)}`;
}

function countDays(minDateStr: string, maxDateStr: string): number {
  const diff = parseDateStr(maxDateStr).getTime() - parseDateStr(minDateStr).getTime();
  return Math.round(diff / 86_400_000) + 1;
}

interface DateRangePickerProps {
  preset: DateRangeSelection;
  customStart: string;
  customEnd: string;
  /** Fallback caption for "All Records" — the real span of the loaded entries. */
  allTimeLabel?: string;
  onChange: (next: { preset: DateRangeSelection; customStart: string; customEnd: string }) => void;
}

export default function DateRangePicker({
  preset,
  customStart,
  customEnd,
  allTimeLabel,
  onChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Draft custom selection, only committed on Apply.
  const [draftStart, setDraftStart] = useState<string>(customStart);
  const [draftEnd, setDraftEnd] = useState<string>(customEnd);
  const [hoverDate, setHoverDate] = useState<string>("");
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const anchor = customStart ? parseDateStr(customStart) : new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const activeRange = useMemo(
    () => resolveDateRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const triggerLabel =
    preset === "allTime" ? allTimeLabel || "All Records" : formatRangeLabel(activeRange.minDateStr, activeRange.maxDateStr);

  const triggerMeta =
    preset === "allTime"
      ? "Every record"
      : `${countDays(activeRange.minDateStr, activeRange.maxDateStr)} days`;

  // Reopening always starts from the currently applied range.
  useEffect(() => {
    if (!open) return;
    const seed = preset === "custom" ? { start: customStart, end: customEnd } : activeRange.minDateStr === "2000-01-01"
      ? { start: formatDateYYYYMMDD(new Date()), end: formatDateYYYYMMDD(new Date()) }
      : { start: activeRange.minDateStr, end: activeRange.maxDateStr };
    setDraftStart(seed.start);
    setDraftEnd(seed.end);
    setHoverDate("");
    const anchor = parseDateStr(seed.start);
    setViewMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handlePresetClick = (value: DateRangePreset) => {
    const range = getPresetDateRange(value);
    onChange({ preset: value, customStart: range.minDateStr, customEnd: range.maxDateStr });
    setOpen(false);
  };

  // First click opens a new range, second click closes it (auto-ordered).
  const handleDayClick = (day: Date) => {
    const dayStr = formatDateYYYYMMDD(day);
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(dayStr);
      setDraftEnd("");
      return;
    }
    if (dayStr < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(dayStr);
    } else {
      setDraftEnd(dayStr);
    }
  };

  const handleApply = () => {
    if (!draftStart) return;
    const end = draftEnd || draftStart;
    onChange({ preset: "custom", customStart: draftStart, customEnd: end });
    setOpen(false);
  };

  // While only one end is picked, the hovered day previews the other end.
  const previewEnd = draftEnd || (draftStart && hoverDate > draftStart ? hoverDate : "");
  const previewStart = draftStart && !draftEnd && hoverDate && hoverDate < draftStart ? hoverDate : draftStart;

  const draftLabel = draftStart
    ? formatRangeLabel(draftStart, draftEnd || draftStart)
    : "Pick a start date";
  const draftDays = draftStart ? countDays(draftStart, draftEnd || draftStart) : 0;

  const todayStr = formatDateYYYYMMDD(new Date());

  const renderMonth = (monthOffset: number, className = "") => {
    const monthDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + monthOffset, 1);
    const cells = buildMonthGrid(monthDate.getFullYear(), monthDate.getMonth());

    return (
      <div className={className}>
        <div className='h-7 flex items-center justify-center'>
          <span className='text-[11px] font-mono font-bold uppercase tracking-wider text-[#ecd0b9]/80'>
            {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
          </span>
        </div>

        <div className='grid grid-cols-7 mt-2'>
          {WEEKDAY_INITIALS.map((initial, idx) => (
            <div
              key={idx}
              className='h-6 flex items-center justify-center text-[10px] font-mono font-bold text-[#ecd0b9]/35'
            >
              {initial}
            </div>
          ))}

          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className='h-8' />;

            const dayStr = formatDateYYYYMMDD(day);
            const isStart = dayStr === previewStart;
            const isEnd = dayStr === previewEnd || (!previewEnd && dayStr === previewStart);
            const inRange =
              previewStart && previewEnd && dayStr > previewStart && dayStr < previewEnd;
            const isToday = dayStr === todayStr;
            const isEdge = isStart || isEnd;

            return (
              <button
                key={idx}
                type='button'
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoverDate(dayStr)}
                onMouseLeave={() => setHoverDate("")}
                aria-label={day.toDateString()}
                aria-pressed={isEdge || !!inRange}
                className={[
                  "h-8 w-full text-[11px] font-mono font-semibold cursor-pointer transition-colors relative",
                  inRange ? "bg-[#a66e46]/18 text-white" : "",
                  isEdge ? "bg-[#a66e46] text-white" : "",
                  !isEdge && !inRange ? "text-[#ecd0b9]/70 hover:bg-white/5 hover:text-white" : "",
                  isStart && previewEnd && previewEnd !== previewStart ? "rounded-l-lg" : "",
                  isEnd && previewStart !== previewEnd ? "rounded-r-lg" : "",
                  isEdge && previewStart === previewEnd ? "rounded-lg" : "",
                  !isEdge && !inRange ? "rounded-lg" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {day.getDate()}
                {isToday && !isEdge && (
                  <span className='absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#dda67a]' />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className='relative' ref={containerRef}>
      {/* Trigger */}
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-haspopup='dialog'
        aria-expanded={open}
        className='flex items-center gap-2.5 rounded-xl border border-[#2d3a46] bg-[#11171d] hover:bg-[#1a2530] px-3 py-2 text-left cursor-pointer transition outline-none focus-visible:ring-2 focus-visible:ring-[#a66e46]/70 min-h-[44px]'
      >
        <CalendarDays className='h-4 w-4 shrink-0 text-[#dda67a]' />
        <span className='flex flex-col leading-tight'>
          <span className='text-xs font-bold text-white whitespace-nowrap'>{triggerLabel}</span>
          <span className='text-[10px] font-mono uppercase tracking-wider text-[#ecd0b9]/45'>
            {triggerMeta}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#ecd0b9]/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            role='dialog'
            aria-label='Select report date range'
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
            transition={
              reduceMotion ? { duration: 0.12 } : { type: "spring", damping: 25, stiffness: 350 }
            }
            className='absolute right-0 z-50 mt-2 w-[min(92vw,44rem)] origin-top-right rounded-2xl border border-[#3e271a]/70 bg-[#130d0a]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden'
          >
            <div className='flex flex-col sm:flex-row'>
              {/* Presets */}
              <div className='sm:w-40 sm:shrink-0 border-b sm:border-b-0 sm:border-r border-[#3e271a]/55 p-2'>
                <p className='hidden sm:block px-2 pt-1 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ecd0b9]/40'>
                  Quick ranges
                </p>
                <div className='flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible'>
                  {DATE_RANGE_PRESETS.map((option) => {
                    const isActive = preset === option.value;
                    return (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => handlePresetClick(option.value)}
                        className={`shrink-0 sm:w-full text-left whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition ${
                          isActive
                            ? "bg-[#a66e46] text-white"
                            : "text-[#ecd0b9]/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendars */}
              <div className='flex-1 p-3 sm:p-4'>
                <div className='flex items-center justify-between'>
                  <button
                    type='button'
                    onClick={() =>
                      setViewMonth(
                        new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
                      )
                    }
                    aria-label='Previous month'
                    className='h-8 w-8 flex items-center justify-center rounded-lg text-[#ecd0b9]/60 hover:bg-white/5 hover:text-white cursor-pointer transition'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <span className='text-[10px] font-mono font-bold uppercase tracking-wider text-[#ecd0b9]/40'>
                    Custom range
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      setViewMonth(
                        new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
                      )
                    }
                    aria-label='Next month'
                    className='h-8 w-8 flex items-center justify-center rounded-lg text-[#ecd0b9]/60 hover:bg-white/5 hover:text-white cursor-pointer transition'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>

                <div className='mt-1 flex gap-5'>
                  {renderMonth(0, "flex-1 min-w-0")}
                  {renderMonth(1, "hidden md:block flex-1 min-w-0")}
                </div>

                <div className='mt-3 pt-3 border-t border-[#3e271a]/55 flex items-center justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold text-white truncate'>{draftLabel}</p>
                    <p className='text-[10px] font-mono uppercase tracking-wider text-[#ecd0b9]/45'>
                      {draftStart
                        ? draftEnd
                          ? `${draftDays} days selected`
                          : "Pick an end date"
                        : "No dates selected"}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <button
                      type='button'
                      onClick={() => setOpen(false)}
                      className='px-3 py-2 rounded-xl text-xs font-semibold text-[#ecd0b9]/70 hover:bg-white/5 hover:text-white cursor-pointer transition'
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      onClick={handleApply}
                      disabled={!draftStart}
                      className='px-4 py-2 rounded-xl text-xs font-semibold bg-[#a66e46] text-white hover:bg-[#8e5a34] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition'
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
