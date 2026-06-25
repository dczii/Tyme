'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Square,
  Trash2,
  AlertTriangle,
  Folder,
  Tag,
  Clock,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { TimeEntry, Project, Tag as TagType } from "../types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  getMonday,
  getWeekDays,
  formatDateYYYYMMDD,
  formatDateFriendly,
  formatMinutesHHMM,
  formatMinutesDecimal,
  calculateDurationMinutes,
  timeStringToDecimal,
} from "../utils";

interface CalendarViewProps {
  entries: TimeEntry[];
  projects: Project[];
  tags: TagType[];
  onAddEntry: (entry: Omit<TimeEntry, "id">) => void;
  onUpdateEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
  onAddProject: (name: string, color: string, client?: string) => Project;
  onAddTag: (name: string) => TagType;
  theme: "light" | "dark";
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00 - standard active hours
const ROW_HEIGHT = 56; // tall row for nice click targets and reading text

const formatHoursAndMinutes = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const parseDurationStringToMinutes = (str: string): number | null => {
  const trimmed = str.trim();
  if (!trimmed) return null;
  const hSeparator = trimmed.indexOf(":");
  if (hSeparator !== -1) {
    const hoursStr = trimmed.substring(0, hSeparator);
    const minsStr = trimmed.substring(hSeparator + 1);
    const hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    if (!isNaN(hours) && !isNaN(mins)) {
      return hours * 60 + mins;
    }
  }
  const decimalVal = parseFloat(trimmed);
  if (!isNaN(decimalVal) && decimalVal >= 0) {
    return Math.round(decimalVal * 60);
  }
  return null;
};

const addMinutesToTime = (timeStr: string, minutes: number): string => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return timeStr;
  }
  const [h, m] = parts;
  const totalMin = (h * 60 + m + minutes) % 1440;
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

export default function CalendarView({
  entries,
  projects,
  tags,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onAddProject,
  onAddTag,
  theme,
}: CalendarViewProps) {
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => {
    // Default to the week containing today's date
    return getMonday(new Date());
  });

  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const todayStr = formatDateYYYYMMDD(new Date());
    const monday = getMonday(new Date());
    const days = getWeekDays(monday);
    const idx = days.findIndex((d) => formatDateYYYYMMDD(d) === todayStr);
    return idx !== -1 ? idx : 0;
  });

  // Range Picker states and references
  const [showRangePicker, setShowRangePicker] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(() => new Date().getFullYear());
  const [pickerMonth1, setPickerMonth1] = useState<number>(() => new Date().getMonth());
  const rangePickerRef = useRef<HTMLDivElement>(null);

  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);

  // Sync range picker selection with currentWeekMonday
  useEffect(() => {
    setRangeStart(currentWeekMonday);
    const end = new Date(currentWeekMonday);
    end.setDate(currentWeekMonday.getDate() + 6);
    setRangeEnd(end);
  }, [currentWeekMonday]);

  const pickerMonth2 = (pickerMonth1 + 1) % 12;
  const pickerYear2 = pickerMonth1 === 11 ? pickerYear + 1 : pickerYear;

  // Sync picker view month to the current week's Monday
  useEffect(() => {
    setPickerYear(currentWeekMonday.getFullYear());
    setPickerMonth1(currentWeekMonday.getMonth());
  }, [currentWeekMonday]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rangePickerRef.current && !rangePickerRef.current.contains(event.target as Node)) {
        setShowRangePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateMMDDYYYY = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const y = d.getFullYear();
    return `${m}/${dd}/${y}`;
  };

  const getDaysInMonthGrid = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    // Monday = index 1. Sunday = index 0 (requires 6 days padding)
    const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(year, month, 1 - paddingDays);
    const gridDays: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      gridDays.push(d);
    }
    return gridDays;
  };

  const prevMonths = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pickerMonth1 === 0) {
      setPickerMonth1(11);
      setPickerYear(pickerYear - 1);
    } else {
      setPickerMonth1(pickerMonth1 - 1);
    }
  };

  const nextMonths = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pickerMonth1 === 11) {
      setPickerMonth1(0);
      setPickerYear(pickerYear + 1);
    } else {
      setPickerMonth1(pickerMonth1 + 1);
    }
  };

  const selectTodayWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
    setShowRangePicker(false);
  };

  const selectYesterdayWeek = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setCurrentWeekMonday(getMonday(yesterday));
    setShowRangePicker(false);
  };

  const selectThisWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
    setShowRangePicker(false);
  };

  const selectLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    setCurrentWeekMonday(getMonday(lastWeek));
    setShowRangePicker(false);
  };

  const handlePickerDayClick = (clickedDate: Date) => {
    // If rangeEnd is null or we are starting a fresh selection
    if (!rangeStart || rangeEnd !== null) {
      setRangeStart(clickedDate);
      setRangeEnd(null);
    } else {
      // Second click: clickedDate is either start or end depending on ordering
      const start = clickedDate < rangeStart ? clickedDate : rangeStart;
      const end = clickedDate < rangeStart ? rangeStart : clickedDate;

      // Calculate days difference (inclusive)
      const d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const d2 = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays === 7) {
        setRangeStart(start);
        setRangeEnd(end);
        setCurrentWeekMonday(start);
        setShowRangePicker(false);
        // Toast for successful selection
        const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const endStr = end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        toast.success(`Week selected successfully: ${startStr} - ${endStr}`);
      } else {
        // Reset range start to clicked selection for friendly retry
        setRangeStart(clickedDate);
        setRangeEnd(null);
        toast.error(
          "Invalid range selected! You must select an interval of exactly one week (7 days).",
          {
            description: `Selected range was ${diffDays} day${diffDays === 1 ? "" : "s"}. This date is now set as the start date. Click another date to select a 7-day range.`,
            duration: 5000,
          },
        );
      }
    }
  };

  const renderCalendarMonth = (year: number, month: number, isLeftMonth: boolean) => {
    const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const gridDays = getDaysInMonthGrid(year, month);
    const dayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    return (
      <div className='w-[220px] select-none flex flex-col'>
        {/* Month Title Header Row */}
        <div className='flex items-center justify-between mb-3.5 px-1'>
          {isLeftMonth ? (
            <button
              type='button'
              onClick={prevMonths}
              className='p-1 rounded-lg hover:bg-white/10 text-[#ecd0b9]/80 hover:text-white cursor-pointer transition'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
          ) : (
            <div className='w-6' />
          )}

          <span className='text-xs font-bold tracking-wider text-white'>{monthName}</span>

          {!isLeftMonth ? (
            <button
              type='button'
              onClick={nextMonths}
              className='p-1 rounded-lg hover:bg-white/10 text-[#ecd0b9]/80 hover:text-white cursor-pointer transition'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          ) : (
            <div className='w-6' />
          )}
        </div>

        {/* Days of Week Row */}
        <div className='grid grid-cols-7 mb-1.5 text-center'>
          {dayHeaders.map((day) => (
            <span key={day} className='text-[10px] font-bold text-[#ecd0b9]/50 select-none'>
              {day}
            </span>
          ))}
        </div>

        {/* Days of Month Grid */}
        <div className='grid grid-cols-7 gap-y-0.5'>
          {gridDays.map((dateObj, dIdx) => {
            const isCurrentMonth = dateObj.getMonth() === month;

            let isSelected = false;
            let isStart = false;
            let isEnd = false;

            if (rangeStart) {
              const dObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
              if (rangeEnd === null) {
                const dS = new Date(
                  rangeStart.getFullYear(),
                  rangeStart.getMonth(),
                  rangeStart.getDate(),
                );
                isSelected = dObj.getTime() === dS.getTime();
                isStart = isSelected;
              } else {
                const s = rangeStart < rangeEnd ? rangeStart : rangeEnd;
                const e = rangeStart < rangeEnd ? rangeEnd : rangeStart;
                const dS = new Date(s.getFullYear(), s.getMonth(), s.getDate());
                const dE = new Date(e.getFullYear(), e.getMonth(), e.getDate());
                isSelected = dObj >= dS && dObj <= dE;
                isStart = dObj.getTime() === dS.getTime();
                isEnd = dObj.getTime() === dE.getTime();
              }
            }

            let textClass =
              "text-[11px] font-sans font-semibold text-center py-1.5 w-full relative flex items-center justify-center cursor-pointer transition duration-150 z-10";
            if (!isCurrentMonth) {
              textClass += " text-white/15 hover:text-white/40";
            } else if (isSelected) {
              textClass += " text-white";
            } else {
              textClass += " text-[#ecd0b9]/80 hover:bg-white/5 hover:text-white rounded-lg";
            }

            return (
              <div
                key={dIdx}
                onClick={() => handlePickerDayClick(dateObj)}
                className={`relative flex items-center justify-center p-0.5 group ${isCurrentMonth ? "cursor-pointer" : ""}`}
              >
                {/* Selected Range highlighting background block */}
                {isSelected && (
                  <span
                    className={`absolute inset-y-0.5 bg-[#a66e46]/35 z-0
                      ${isStart ? "left-1/2 right-0 rounded-l-none" : ""}
                      ${isEnd ? "left-0 right-1/2 rounded-r-none" : ""}
                      ${!isStart && !isEnd ? "left-0 right-0" : ""}`}
                  />
                )}
                {/* Selected Endpoint Circle */}
                {(isStart || isEnd) && (
                  <span className='absolute h-6.5 w-6.5 rounded-full bg-[#a66e46] shadow-md shadow-[#4a2b16]/40 z-0' />
                )}

                <span className={textClass}>{dateObj.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Track state for the Top Real-time Timer
  const [isTracking, setIsTracking] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tyme_timer_is_tracking") === "true";
  });
  const [timerDesc, setTimerDesc] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("tyme_timer_desc") || "";
  });
  const [timerProjId, setTimerProjId] = useState<string>(() => {
    if (typeof window === "undefined") return projects[0]?.id || "";
    const stored = localStorage.getItem("tyme_timer_proj_id");
    if (stored !== null) return stored;
    return projects[0]?.id || "";
  });
  const [timerTags, setTimerTags] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("tyme_timer_tags");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("tyme_timer_start_time");
    if (!stored) return null;
    const date = new Date(stored);
    return isNaN(date.getTime()) ? null : date;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerIntervalId, setTimerIntervalId] = useState<any | null>(null);

  // Sync Timer State to localStorage
  useEffect(() => {
    localStorage.setItem("tyme_timer_is_tracking", String(isTracking));
  }, [isTracking]);

  useEffect(() => {
    localStorage.setItem("tyme_timer_desc", timerDesc);
  }, [timerDesc]);

  useEffect(() => {
    localStorage.setItem("tyme_timer_proj_id", timerProjId);
  }, [timerProjId]);

  useEffect(() => {
    localStorage.setItem("tyme_timer_tags", JSON.stringify(timerTags));
  }, [timerTags]);

  useEffect(() => {
    if (timerStartTime) {
      localStorage.setItem("tyme_timer_start_time", timerStartTime.toISOString());
    } else {
      localStorage.removeItem("tyme_timer_start_time");
    }
  }, [timerStartTime]);

  useEffect(() => {
    const stored = localStorage.getItem("tyme_timer_proj_id");
    if (!timerProjId && !stored && projects.length > 0) {
      setTimerProjId(projects[0].id);
    }
  }, [projects, timerProjId]);

  // States for manual fast-entry or full edit dialog
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newEntryDate, setNewEntryDate] = useState<string>("");
  const [newEntryStartTime, setNewEntryStartTime] = useState<string>("09:00");
  const [newEntryEndTime, setNewEntryEndTime] = useState<string>("12:00");
  const [modalDurationStr, setModalDurationStr] = useState<string>("3:00");
  const [editDurationStr, setEditDurationStr] = useState<string>("");
  const [modalSelectedTags, setModalSelectedTags] = useState<string[]>([]);
  const [showModalTagDropdown, setShowModalTagDropdown] = useState<boolean>(false);

  // Drag-and-drop state
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dragGhostPosition, setDragGhostPosition] = useState<{ dayIndex: number; startHour: number } | null>(null);
  const draggedEntryDuration = useRef<number>(0);
  const gridBodyRef = useRef<HTMLDivElement>(null);

  // Mobile touch drag state
  const [touchDragEntryId, setTouchDragEntryId] = useState<string | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{ x: number; y: number } | null>(null);
  const touchDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setEditDurationStr(formatMinutesHHMM(editingEntry.durationMinutes));
    } else {
      setEditDurationStr("");
    }
  }, [editingEntry?.id]);

  // Listen for Escape key to close open modals or cancel drag
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (draggedEntryId) {
          setDraggedEntryId(null);
          setDragGhostPosition(null);
          return;
        }
        if (editingEntry) {
          setEditingEntry(null);
        }
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          setShowModalTagDropdown(false);
        }
      }
    };

    if (editingEntry || isCreateModalOpen || draggedEntryId) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingEntry, isCreateModalOpen, draggedEntryId]);

  // Time dynamics helper changes
  const handleStartTimeChange = (newStart: string) => {
    setNewEntryStartTime(newStart);
    const mins = calculateDurationMinutes(newStart, newEntryEndTime);
    setModalDurationStr(formatMinutesHHMM(mins));
  };

  const handleEndTimeChange = (newEnd: string) => {
    setNewEntryEndTime(newEnd);
    const mins = calculateDurationMinutes(newEntryStartTime, newEnd);
    setModalDurationStr(formatMinutesHHMM(mins));
  };

  const handleDurationStrChange = (newDurStr: string) => {
    setModalDurationStr(newDurStr);
    const parsedMins = parseDurationStringToMinutes(newDurStr);
    if (parsedMins !== null && parsedMins >= 0) {
      const updatedEnd = addMinutesToTime(newEntryStartTime, parsedMins);
      setNewEntryEndTime(updatedEnd);
    }
  };

  const handleEditDurationStrChange = (newDurStr: string) => {
    if (!editingEntry) return;
    setEditDurationStr(newDurStr);
    const parsedMins = parseDurationStringToMinutes(newDurStr);
    if (parsedMins !== null && parsedMins >= 0) {
      const updatedEnd = addMinutesToTime(editingEntry.startTime, parsedMins);
      const newDur = calculateDurationMinutes(editingEntry.startTime, updatedEnd);
      setEditingEntry({
        ...editingEntry,
        endTime: updatedEnd,
        durationMinutes: newDur,
      });
    }
  };

  // New Project creator inline form
  const [showProjCreator, setShowProjCreator] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>("");
  const [newProjClient, setNewProjClient] = useState<string>("");
  const [newProjColor, setNewProjColor] = useState<string>("#3b82f6");

  // New Tag creator inline form
  const [showTagCreator, setShowTagCreator] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>("");

  // Dropdown states for the Timer/Creator Bar
  const [showProjDropdown, setShowProjDropdown] = useState<boolean>(false);
  const [showTagDropdown, setShowTagDropdown] = useState<boolean>(false);

  // Active days array based on currentWeekMonday
  const weekDays = getWeekDays(currentWeekMonday);
  const formattedWeekDays = weekDays.map((d) => formatDateYYYYMMDD(d));

  // Run stopwatch interval when tracking is true
  useEffect(() => {
    if (isTracking && timerStartTime) {
      const updateSeconds = () => {
        const secs = Math.floor((new Date().getTime() - timerStartTime.getTime()) / 1000);
        setElapsedSeconds(Math.max(0, secs));
      };
      updateSeconds();
      const interval = setInterval(updateSeconds, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking, timerStartTime]);

  // Handle live stopwatch start/stop
  const handleStartTimer = () => {
    if (!timerDesc.trim()) {
      toast.error("Please enter task details before starting the timer.");
      return;
    }
    setIsTracking(true);
    setTimerStartTime(new Date());
    setElapsedSeconds(0);
  };

  const handleStopTimer = () => {
    if (!timerStartTime) return;
    setIsTracking(false);

    const stopTime = new Date();
    const durationMins = Math.max(
      1,
      Math.round((stopTime.getTime() - timerStartTime.getTime()) / 60000),
    );

    const fmtTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    };

    onAddEntry({
      description: timerDesc || "Untitled Session",
      projectId: projects[0]?.id || undefined,
      tags: timerTags,
      date: formatDateYYYYMMDD(new Date()), // Log to current system date
      startTime: fmtTime(timerStartTime),
      endTime: fmtTime(stopTime),
      durationMinutes: durationMins,
    });

    // Reset fields
    setTimerDesc("");
    setTimerProjId(projects[0]?.id || "");
    setTimerTags([]);
    setTimerStartTime(null);
    setElapsedSeconds(0);
  };

  // Move week backward / forward
  const navigateWeek = (weeks: number) => {
    const nextMon = new Date(currentWeekMonday);
    nextMon.setDate(currentWeekMonday.getDate() + weeks * 7);
    setCurrentWeekMonday(nextMon);
  };

  const jumpToToday = () => {
    const today = new Date();
    const monday = getMonday(today);
    setCurrentWeekMonday(monday);
    const days = getWeekDays(monday);
    const todayStr = formatDateYYYYMMDD(today);
    const idx = days.findIndex((d) => formatDateYYYYMMDD(d) === todayStr);
    setActiveDayIndex(idx !== -1 ? idx : 0);
  };

  // Sub-metrics per day
  const getDailyEntries = (dateStr: string) => {
    return entries.filter((e) => e.date === dateStr);
  };

  const getDailyTotalMinutes = (dateStr: string) => {
    return getDailyEntries(dateStr).reduce((acc, curr) => acc + curr.durationMinutes, 0);
  };

  const getWeeklyTotalMinutes = () => {
    return formattedWeekDays.reduce((acc, dayStr) => acc + getDailyTotalMinutes(dayStr), 0);
  };

  // Fast inline tools for tag inclusion
  const toggleTimerTag = (tagName: string) => {
    if (timerTags.includes(tagName)) {
      setTimerTags((prev) => prev.filter((t) => t !== tagName));
    } else {
      setTimerTags((prev) => [...prev, tagName]);
    }
  };

  // Overlap validator: checks if an entry overlaps with another on the same day
  const checkHasOverlap = (entry: TimeEntry) => {
    const dayEntries = entries.filter((e) => e.date === entry.date && e.id !== entry.id);
    const startDec = timeStringToDecimal(entry.startTime);
    const endDec = timeStringToDecimal(entry.endTime);

    return dayEntries.some((e) => {
      const s = timeStringToDecimal(e.startTime);
      const val = timeStringToDecimal(e.endTime);
      // overlap if interval intersects
      return startDec < val && s < endDec;
    });
  };

  // Dynamic Positioning calculations for calendar items
  const getEntryPositionStyles = (entry: TimeEntry) => {
    const startDec = timeStringToDecimal(entry.startTime);
    const endDec = timeStringToDecimal(entry.endTime);

    const startHourLimit = HOURS[0];
    const endHourLimit = HOURS[HOURS.length - 1] + 1; // 24.0

    // Crop offsets to visible boundaries
    const offsetCalcStart = Math.max(startHourLimit, Math.min(endHourLimit, startDec));
    const offsetCalcEnd = Math.max(startHourLimit, Math.min(endHourLimit, endDec));

    const topOffset = (offsetCalcStart - startHourLimit) * ROW_HEIGHT;
    const heightOffset = Math.max(28, (offsetCalcEnd - offsetCalcStart) * ROW_HEIGHT); // Ensure a clean min height

    return {
      top: `${topOffset}px`,
      height: `${heightOffset}px`,
    };
  };

  // Quick project insertion handler
  const handleCreateProjectInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const created = onAddProject(
      newProjName.trim(),
      newProjColor,
      newProjClient.trim() || undefined,
    );
    setTimerProjId(created.id);
    setNewProjName("");
    setNewProjClient("");
    setShowProjCreator(false);
  };

  // Quick tag insertion handler
  const handleCreateTagInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const created = onAddTag(newTagName.trim());
    setTimerTags((prev) => [...prev, created.name]);
    setNewTagName("");
    setShowTagCreator(false);
  };

  // Quick form setup to handle adding a slot
  const handleSlotClicked = (dateStr: string, hourVal: number) => {
    if (draggedEntryId) return; // Don't open modal during drag
    setNewEntryDate(dateStr);
    const startStr = `${String(hourVal).padStart(2, "0")}:00`;
    const endStr = `${String(hourVal + 1).padStart(2, "0")}:00`;
    setNewEntryStartTime(startStr);
    setNewEntryEndTime(endStr);
    setModalDurationStr("1:00");
    setModalSelectedTags([]);
    setShowModalTagDropdown(false);
    setIsCreateModalOpen(true);
  };

  // --- Drag-and-Drop Helpers ---

  // Convert a Y pixel offset in the grid body to a time string snapped to 15-min increments
  const yPositionToTime = useCallback((y: number): string => {
    const hourOffset = y / ROW_HEIGHT;
    const absoluteHour = HOURS[0] + hourOffset;
    // Snap to nearest 15 minutes
    const totalMinutes = Math.round(absoluteHour * 60);
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const clampedMinutes = Math.max(HOURS[0] * 60, Math.min((HOURS[HOURS.length - 1] + 1) * 60 - 1, snappedMinutes));
    const h = Math.floor(clampedMinutes / 60);
    const m = clampedMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, []);

  // Desktop drag start
  const handleEntryDragStart = useCallback((entry: TimeEntry, e: React.DragEvent) => {
    setDraggedEntryId(entry.id);
    draggedEntryDuration.current = entry.durationMinutes;
    // Set drag image to a small transparent pixel to use our custom ghost
    const ghost = document.createElement("div");
    ghost.style.width = "1px";
    ghost.style.height = "1px";
    ghost.style.opacity = "0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    e.dataTransfer.effectAllowed = "move";
    // Clean up the ghost element after a frame
    requestAnimationFrame(() => document.body.removeChild(ghost));
  }, []);

  // Desktop drag over grid body — compute ghost position
  const handleGridDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!gridBodyRef.current || !draggedEntryId) return;

    const gridRect = gridBodyRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top;

    // The hour column takes up the first 60px (md) or 44px — detect from the DOM
    const hourColWidth = window.innerWidth >= 768 ? 60 : 44;
    const x = e.clientX - gridRect.left - hourColWidth;
    const dayAreaWidth = gridRect.width - hourColWidth;
    const dayIndex = Math.max(0, Math.min(6, Math.floor((x / dayAreaWidth) * 7)));

    // Compute the start hour from Y position (snapped to 15 min)
    const hourOffset = y / ROW_HEIGHT;
    const absoluteHour = HOURS[0] + hourOffset;
    const totalMinutes = Math.round(absoluteHour * 60);
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const startHour = snappedMinutes / 60;

    setDragGhostPosition({ dayIndex, startHour });
  }, [draggedEntryId]);

  // Desktop drop handler
  const handleGridDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEntryId || !dragGhostPosition) {
      setDraggedEntryId(null);
      setDragGhostPosition(null);
      return;
    }

    const entry = entries.find(en => en.id === draggedEntryId);
    if (!entry) {
      setDraggedEntryId(null);
      setDragGhostPosition(null);
      return;
    }

    const newDate = formattedWeekDays[dragGhostPosition.dayIndex];
    const startMinutes = Math.round(dragGhostPosition.startHour * 60);
    const endMinutes = startMinutes + entry.durationMinutes;
    const startH = Math.floor(startMinutes / 60);
    const startM = startMinutes % 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const newStartTime = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
    const newEndTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    // Only update if something actually changed
    if (newDate !== entry.date || newStartTime !== entry.startTime) {
      onUpdateEntry({
        ...entry,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });
      toast.success("Entry moved", {
        description: `${entry.description || "Untitled"} → ${newStartTime}–${newEndTime}`,
        duration: 2000,
      });
    }

    setDraggedEntryId(null);
    setDragGhostPosition(null);
  }, [draggedEntryId, dragGhostPosition, entries, formattedWeekDays, onUpdateEntry]);

  // Desktop drag end (cleanup)
  const handleDragEnd = useCallback(() => {
    setDraggedEntryId(null);
    setDragGhostPosition(null);
  }, []);

  // --- Mobile Touch Drag Handlers ---

  const handleTouchDragStart = useCallback((entry: TimeEntry, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    // Long press to initiate drag (400ms)
    touchDragTimerRef.current = setTimeout(() => {
      setTouchDragEntryId(entry.id);
      draggedEntryDuration.current = entry.durationMinutes;
      setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
    }, 400);
  }, []);

  const handleTouchDragMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Cancel long-press if finger moves significantly before timer fires
    if (touchStartPosRef.current && !touchDragEntryId) {
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (touchDragTimerRef.current) {
          clearTimeout(touchDragTimerRef.current);
          touchDragTimerRef.current = null;
        }
      }
    }
    if (!touchDragEntryId) return;
    e.preventDefault();
    setTouchDragPosition({ x: touch.clientX, y: touch.clientY });

    // Check if finger is over day selector tabs to highlight
    const dayTabs = document.querySelectorAll('[data-day-tab-index]');
    dayTabs.forEach((tab) => {
      const rect = tab.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const idx = parseInt(tab.getAttribute('data-day-tab-index') || '0');
        setActiveDayIndex(idx);
      }
    });
  }, [touchDragEntryId]);

  const handleTouchDragEnd = useCallback((e: React.TouchEvent) => {
    if (touchDragTimerRef.current) {
      clearTimeout(touchDragTimerRef.current);
      touchDragTimerRef.current = null;
    }
    touchStartPosRef.current = null;

    if (!touchDragEntryId) return;

    const entry = entries.find(en => en.id === touchDragEntryId);
    if (entry) {
      // Determine which day tab the touch ended on
      const activeDayStr = formattedWeekDays[activeDayIndex] || formattedWeekDays[0];

      // If date changed, update the entry
      if (activeDayStr !== entry.date) {
        onUpdateEntry({
          ...entry,
          date: activeDayStr,
        });
        toast.success("Entry moved", {
          description: `${entry.description || "Untitled"} moved to ${weekDays[activeDayIndex]?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
          duration: 2000,
        });
      }
    }

    setTouchDragEntryId(null);
    setTouchDragPosition(null);
  }, [touchDragEntryId, entries, formattedWeekDays, activeDayIndex, weekDays, onUpdateEntry]);

  // Ghost indicator position styles for desktop
  const getGhostStyles = useCallback(() => {
    if (!dragGhostPosition || !draggedEntryId) return null;
    const startHourLimit = HOURS[0];
    const topOffset = (dragGhostPosition.startHour - startHourLimit) * ROW_HEIGHT;
    const durationHours = draggedEntryDuration.current / 60;
    const heightOffset = Math.max(28, durationHours * ROW_HEIGHT);
    return {
      top: `${topOffset}px`,
      height: `${heightOffset}px`,
      gridColumnStart: dragGhostPosition.dayIndex + 1,
    };
  }, [dragGhostPosition, draggedEntryId]);

  return (
    <div className='flex-1 flex flex-col min-w-0 z-10'>
      {/* 1. Header Area with dynamic details */}
      <header className='relative z-45 p-4 border-b shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#120805]/40 backdrop-blur-md border-[#321c11]/45'>
        <div>
          <h2 className='text-xl font-display font-semibold text-white'>Calendar Workspace</h2>
          <p className='text-xs text-[#ecd0b9]/65 mt-1'>
            Weekly total:{" "}
            <span className='font-mono font-bold text-[#dda67a]'>
              {formatMinutesHHMM(getWeeklyTotalMinutes())}
            </span>{" "}
            hours logged
          </p>
        </div>

        {/* Navigation & Fast range switch */}
        <div className='flex items-center gap-3'>
          <button
            onClick={jumpToToday}
            className='px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#3d2416]/50 cursor-pointer bg-[#24150d]/40 backdrop-blur-md hover:bg-[#3d2416]/60 text-[#ecd0b9]'
          >
            Today's Week
          </button>

          <div className='relative' ref={rangePickerRef}>
            <div className='flex items-center rounded-xl border border-[#3d2416]/55 bg-[#170e0a]/40 backdrop-blur-md h-10 text-white'>
              <button
                onClick={() => setShowRangePicker(!showRangePicker)}
                className='px-4 py-2 text-xs md:text-sm font-semibold text-[#ecd0b9] hover:bg-[#2c1a11]/45 hover:text-white transition duration-200 cursor-pointer flex items-center gap-2.5 h-full rounded-l-xl select-none'
                title='Click to select week'
              >
                <Calendar className='h-4 w-4 text-[#dda67a] shrink-0' />
                <span className='font-mono tracking-wide hidden md:inline'>
                  {formatDateMMDDYYYY(weekDays[0])} - {formatDateMMDDYYYY(weekDays[6])}
                </span>
                <span className='font-mono tracking-wide md:hidden'>
                  {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </button>

              <div className='w-[1px] h-6 bg-[#3d2416]/55 shrink-0' />

              <button
                onClick={() => navigateWeek(-1)}
                className='p-2.5 bg-transparent hover:bg-white/5 text-[#ecd0b9]/80 cursor-pointer h-full flex items-center justify-center transition'
                title='Previous Week'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>

              <div className='w-[1px] h-6 bg-[#3d2416]/55 shrink-0' />

              <button
                onClick={() => navigateWeek(1)}
                className='p-2.5 bg-transparent hover:bg-white/5 text-[#ecd0b9]/80 cursor-pointer h-full flex items-center justify-center transition rounded-r-xl'
                title='Next Week'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>

            {/* Side-by-Side Dual Month Date Range Picker Popover */}
            {showRangePicker && (
              <div
                id='date-range-picker-popover'
                className='fixed inset-x-4 top-20 md:absolute md:inset-x-auto md:right-0 md:top-11 mt-1 rounded-2xl border border-[#3d2416] bg-[#110a08] shadow-2xl p-0 overflow-hidden z-50 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#3d2416]/50 w-[calc(100vw-2rem)] md:min-w-[620px] md:w-auto'
              >
                {/* Left Sidebar Presets */}
                <div className='w-full md:w-36 shrink-0 bg-[#0c0604]/90 p-2.5 flex flex-row md:flex-col gap-1'>
                  {[
                    { id: "thisWeek", label: "This week", action: selectThisWeek },
                    { id: "lastWeek", label: "Last week", action: selectLastWeek },
                  ].map((preset) => {
                    const lastWeekRef = new Date();
                    lastWeekRef.setDate(lastWeekRef.getDate() - 7);
                    const isCurrentWeek =
                      currentWeekMonday.toDateString() ===
                      getMonday(new Date()).toDateString();
                    const isLastWeek =
                      currentWeekMonday.toDateString() ===
                      getMonday(lastWeekRef).toDateString();

                    let isActive = false;
                    if (preset.id === "thisWeek" && isCurrentWeek) isActive = true;
                    if (preset.id === "lastWeek" && isLastWeek) isActive = true;

                    return (
                      <button
                        key={preset.id}
                        type='button'
                        onClick={preset.action}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer
                          ${
                            isActive
                              ? "bg-[#a66e46] text-white"
                              : "text-[#ecd0b9]/75 hover:bg-white/5"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Dual Calendar Month Grids */}
                <div className='p-4 flex flex-col md:flex-row gap-6 bg-[#130d0a]/90'>
                  {renderCalendarMonth(pickerYear, pickerMonth1, true)}
                  <div className='hidden md:block'>
                    {renderCalendarMonth(pickerYear2, pickerMonth2, false)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Clockify-Style Top Interactive Timer bar */}
      <section className='p-4 border-b shrink-0 bg-[#120805]/20 border-[#2b180d]/40'>
        <div className='max-w-7xl mx-auto bg-[#1c120c]/40 backdrop-blur-xl rounded-2xl border border-[#3d2516]/50 shadow-2xl p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center'>
          {/* Working input */}
          <div className='flex-1 flex items-center gap-3 px-2'>
            <Clock
              className={`h-5 w-5 ${isTracking ? "text-[#dda67a] animate-pulse" : "text-[#ecd0b9]/40"}`}
            />
            <input
              type='text'
              placeholder={
                isTracking ? "Active timer running..." : "What are you working on right now?"
              }
              value={timerDesc}
              onChange={(e) => setTimerDesc(e.target.value)}
              className='w-full text-xs font-sans md:text-sm outline-none bg-transparent text-white placeholder-[#ecd0b9]/40 font-medium'
            />
          </div>

          <div className='flex flex-wrap items-center gap-2 justify-between w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-[#3d2516]/40'>
            {/* Project Pill - Static default project */}
            <div className='relative'>
              <div className='flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-[#3d2516]/60 bg-[#2d1a10]/40 text-[#ecd0b9] font-medium select-none'>
                <Folder className='h-3.5 w-3.5 text-[#dda67a]' />
                <span>{projects[0]?.name || "Tyme Project"}</span>
              </div>

              {showProjDropdown && (
                <div className='absolute right-0 mt-2 w-[calc(100vw-3rem)] md:w-64 rounded-xl shadow-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 p-2 z-50'>
                  <p className='text-[10px] font-mono dark:text-slate-500 text-slate-400 uppercase tracking-wide px-2 py-1'>
                    Projects
                  </p>
                  <div className='max-h-48 overflow-y-auto space-y-0.5 my-1'>
                    <button
                      onClick={() => {
                        setTimerProjId("");
                        setShowProjDropdown(false);
                      }}
                      className='w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/50 dark:hover:bg-white/5 dark:text-slate-300 text-slate-700 transition text-left'
                    >
                      <div className='h-2 w-2 rounded-full bg-slate-400'></div>
                      <span>No Project</span>
                    </button>
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => {
                          setTimerProjId(proj.id);
                          setShowProjDropdown(false);
                        }}
                        className='w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-white/50 dark:hover:bg-white/5 transition text-left'
                      >
                        <span className='flex items-center gap-2 dark:text-slate-200 text-slate-800 font-medium'>
                          <span
                            className='h-2 w-2 rounded-full'
                            style={{ backgroundColor: proj.color }}
                          ></span>
                          {proj.name}
                        </span>
                        {proj.client && (
                          <span className='text-[10px] dark:text-slate-500 text-slate-400'>
                            ({proj.client})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className='border-t border-[#3d2516]/40 pt-2 mt-1'>
                    {!showProjCreator ? (
                      <button
                        onClick={() => setShowProjCreator(true)}
                        className='w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#dda67a] hover:bg-[#dda67a]/15 rounded-lg font-medium cursor-pointer transition'
                      >
                        <Plus className='h-3.5 w-3.5' />
                        <span>Create Project</span>
                      </button>
                    ) : (
                      <form onSubmit={handleCreateProjectInline} className='space-y-2 p-1'>
                        <input
                          type='text'
                          placeholder='Project name *'
                          required
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          className='w-full text-xs p-1.5 rounded border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] outline-none'
                        />
                        <input
                          type='text'
                          placeholder='Client (optional)'
                          value={newProjClient}
                          onChange={(e) => setNewProjClient(e.target.value)}
                          className='w-full text-xs p-1.5 rounded border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] outline-none'
                        />
                        <div className='flex justify-between items-center gap-2'>
                          <div className='flex gap-1.5'>
                            {["#dda67a", "#a66e46", "#8e5a34", "#3e271a", "#f59e0b", "#ef4444"].map(
                              (col) => (
                                <button
                                  type='button'
                                  key={col}
                                  onClick={() => setNewProjColor(col)}
                                  className={`h-4.5 w-4.5 rounded-full border cursor-pointer ${newProjColor === col ? "ring-2 ring-[#dda67a]" : "opacity-70"}`}
                                  style={{ backgroundColor: col }}
                                />
                              ),
                            )}
                          </div>
                          <div className='flex gap-1'>
                            <button
                              type='button'
                              onClick={() => setShowProjCreator(false)}
                              className='px-2 py-1 text-[10px] rounded bg-[#241610] hover:bg-[#341f17] text-[#ecd0b9] border border-[#3e271a]/50'
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              className='px-2 py-1 text-[10px] rounded bg-[#a66e46] text-white font-medium hover:bg-[#8e5a34]'
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tag Selection Dropdown */}
            <div className='relative'>
              <button
                onClick={() => {
                  setShowTagDropdown(!showTagDropdown);
                  setShowProjDropdown(false);
                }}
                className='flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-[#3d2516]/60 bg-[#2d1a10]/40 hover:bg-[#3d2516]/60 backdrop-blur-md cursor-pointer text-[#ecd0b9] font-medium'
              >
                <Tag className='h-3.5 w-3.5 text-[#dda67a]' />
                <span>{timerTags.length > 0 ? `${timerTags.length} filter` : "Tags"}</span>
              </button>

              {showTagDropdown && (
                <div className='absolute right-0 mt-2 w-[calc(100vw-3rem)] md:w-56 rounded-xl shadow-xl bg-[#170e0a]/95 backdrop-blur-xl border border-[#3d2516]/50 p-2 z-50'>
                  <p className='text-[10px] font-mono text-[#ecd0b9]/60 uppercase tracking-wide px-2 py-1'>
                    Tags
                  </p>
                  <div className='max-h-48 overflow-y-auto space-y-0.5 my-1'>
                    {tags.map((t) => {
                      const isSelected = timerTags.includes(t.name);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTimerTag(t.name)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-left transition
                            ${
                              isSelected
                                ? "bg-[#a66e46]/20 text-[#dda67a] font-semibold"
                                : "hover:bg-white/5 text-[#ecd0b9]/75"
                            }`}
                        >
                          <span>{t.name}</span>
                          {isSelected && <Check className='h-3.5 w-3.5' />}
                        </button>
                      );
                    })}
                  </div>

                  <div className='border-t border-[#3d2516]/40 pt-2 mt-1'>
                    {!showTagCreator ? (
                      <button
                        onClick={() => setShowTagCreator(true)}
                        className='w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-medium cursor-pointer transition'
                      >
                        <Plus className='h-3.5 w-3.5' />
                        <span>Create Tag</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handleCreateTagInline}
                        className='space-y-2 p-1 flex items-center gap-2'
                      >
                        <input
                          type='text'
                          placeholder='New tag...'
                          required
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className='w-full text-xs p-1.5 rounded border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] outline-none'
                        />
                        <button
                          type='submit'
                          className='px-2.5 py-1.5 text-xs rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 shrink-0'
                        >
                          Ok
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stopwatch Log Display */}
            {isTracking ? (
              <div className='flex items-center gap-3 px-3 mx-1 font-mono font-bold text-rose-500 text-base md:text-sm select-none tracking-wider'>
                <span className='relative flex h-2 w-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
                </span>
                <span>
                  {String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0")}:
                  {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0")}:
                  {String(elapsedSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <div className='text-[11px] font-mono text-[#ecd0b9]/40 uppercase tracking-widest px-2'>
                Ready
              </div>
            )}

            {/* Start/Stop controller CTA */}
            {isTracking ? (
              <button
                onClick={handleStopTimer}
                className='px-5 py-3 md:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/15'
              >
                <Square className='h-3 w-3 fill-current' />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className='px-5 py-3 md:py-2.5 bg-[#a66e46] hover:bg-[#8e5a34] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#4a2b16]/30 transition duration-150'
              >
                <Play className='h-3 w-3 fill-current' />
                <span>Start</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. The Calendar Content Area */}
      <div className='flex-1 overflow-y-auto bg-[#1a110a]/10 relative'>
        {/* MOBILE DAY VIEW (< md) */}
        <div className='md:hidden flex flex-col pb-24'>
          {/* Day Selector Tabs */}
          <div className='grid grid-cols-7 gap-1 bg-[#150d0a]/90 backdrop-blur-md border-b border-[#3c2518]/45 p-2 sticky top-0 z-25'>
            {weekDays.map((dateObj, idx) => {
              const dayStr = formatDateYYYYMMDD(dateObj);
              const totalMins = getDailyTotalMinutes(dayStr);
              const isSelected = idx === activeDayIndex;
              const isToday = dayStr === formatDateYYYYMMDD(new Date());

              return (
                <button
                  key={idx}
                  data-day-tab-index={idx}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition duration-150 cursor-pointer
                    ${
                      isSelected
                        ? "bg-[#a66e46] text-[#fff6f0] shadow-md shadow-[#4a2b16]/40"
                        : isToday
                          ? "bg-[#a66e46]/10 text-[#dda67a] border border-[#a66e46]/25"
                          : "text-[#ecd0b9]/60 hover:text-[#ecd0b9] hover:bg-white/[0.02]"
                    }`}
                >
                  <span className='text-[9px] font-bold tracking-wider uppercase opacity-85'>
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 3)}
                  </span>
                  <span className='text-sm font-semibold font-display mt-0.5'>
                    {dateObj.getDate()}
                  </span>
                  <span
                    className={`text-[8px] font-mono font-bold mt-1 px-1 rounded-full
                    ${
                      isSelected
                        ? "bg-black/20 text-[#fff6f0]"
                        : totalMins > 0
                          ? "bg-[#4a2d1a]/40 text-[#dda67a]"
                          : "text-[#ecd0b9]/30"
                    }`}
                  >
                    {totalMins > 0 ? formatMinutesHHMM(totalMins) : "0:00"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Entries List */}
          {(() => {
            const activeDayStr = formattedWeekDays[activeDayIndex] || formattedWeekDays[0];
            const activeDayEntries = getDailyEntries(activeDayStr).sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );

            if (activeDayEntries.length > 0) {
              return (
                <div className='space-y-3 p-4'>
                  <AnimatePresence initial={false}>
                    {activeDayEntries.map((entry) => {
                      const proj = entry.projectId
                        ? projects.find((p) => p.id === entry.projectId)
                        : null;
                      const hasOverlap = checkHasOverlap(entry);
                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{
                            opacity: touchDragEntryId === entry.id ? 0.3 : 1,
                            scale: touchDragEntryId === entry.id ? 0.95 : 1,
                            y: 0
                          }}
                          exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }}
                          onClick={() => { if (!touchDragEntryId) setEditingEntry(entry); }}
                          onTouchStart={(e) => handleTouchDragStart(entry, e)}
                          onTouchMove={handleTouchDragMove}
                          onTouchEnd={handleTouchDragEnd}
                          className={`bg-[#1c120c]/60 backdrop-blur-xl border border-[#3d2516]/50 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-md hover:border-[#a66e46]/60 cursor-grab active:cursor-grabbing active:scale-[0.99] transition duration-150
                            ${touchDragEntryId === entry.id ? 'opacity-30 border-dashed' : ''}`}
                        style={{
                          borderLeft: `4px solid ${proj?.color || "#a66e46"}`,
                          borderColor: hasOverlap ? "#ef4444" : undefined,
                        }}
                      >
                        <div className='flex justify-between items-start gap-2'>
                          <div className='min-w-0'>
                            {proj && (
                              <div className='flex items-center gap-1.5 mb-1'>
                                <span
                                  className='h-2 w-2 rounded-full shrink-0'
                                  style={{ backgroundColor: proj.color }}
                                />
                                <span
                                  className='text-[11px] font-semibold tracking-wide truncate'
                                  style={{ color: proj.color }}
                                >
                                  {proj.name}
                                </span>
                              </div>
                            )}
                            <h4 className='text-sm font-semibold text-white leading-snug break-words'>
                              {entry.description || "No Description"}
                            </h4>
                          </div>
                          <span className='text-sm font-mono font-bold text-[#dda67a] bg-[#dda67a]/10 px-2 py-0.5 rounded-lg shrink-0'>
                            {formatHoursAndMinutes(entry.durationMinutes)}
                          </span>
                        </div>

                        <div className='flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#3d2516]/20'>
                          <span className='text-[11px] font-mono text-[#ecd0b9]/60'>
                            {entry.startTime} - {entry.endTime}
                          </span>

                          <div className='flex items-center gap-1.5'>
                            {hasOverlap && (
                              <div className='flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-bold'>
                                <AlertTriangle className='h-3 w-3' />
                                <span>Overlap</span>
                              </div>
                            )}

                            {entry.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className='px-2 py-0.5 rounded text-[9px] font-medium bg-[#1d1410] border border-[#3e271a]/65 text-[#ecd0b9]/75'
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              );
            } else {
              return (
                <div className='flex flex-col items-center justify-center py-20 px-4 text-center'>
                  <div className='h-12 w-12 rounded-full bg-[#3d2416]/20 flex items-center justify-center mb-3'>
                    <Clock className='h-6 w-6 text-[#dda67a]/60' />
                  </div>
                  <p className='text-sm font-semibold text-[#ecd0b9]/80'>
                    No time logged for this day
                  </p>
                  <p className='text-xs text-[#ecd0b9]/50 mt-1'>
                    Tap the floating button below or start a live timer to log hours.
                  </p>
                </div>
              );
            }
          })()}

          {/* Mobile touch drag floating card */}
          {touchDragEntryId && touchDragPosition && (() => {
            const dragEntry = entries.find(e => e.id === touchDragEntryId);
            if (!dragEntry) return null;
            const proj = dragEntry.projectId ? projects.find(p => p.id === dragEntry.projectId) : null;
            return (
              <div
                className='fixed z-[100] pointer-events-none'
                style={{
                  left: touchDragPosition.x - 100,
                  top: touchDragPosition.y - 30,
                  width: 200,
                }}
              >
                <div
                  className='bg-[#1c120c]/90 backdrop-blur-xl border-2 border-[#dda67a]/50 rounded-2xl p-3 shadow-2xl'
                  style={{ borderLeft: `4px solid ${proj?.color || '#a66e46'}` }}
                >
                  <p className='text-xs font-semibold text-white truncate'>
                    {dragEntry.description || 'Untitled'}
                  </p>
                  <p className='text-[10px] font-mono text-[#dda67a] mt-1'>
                    {dragEntry.startTime} – {dragEntry.endTime}
                  </p>
                  <p className='text-[9px] text-[#ecd0b9]/50 mt-0.5'>
                    Drag to a day tab to move
                  </p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* DESKTOP WEEKLY GRID (>= md) */}
        <div className='hidden md:block p-6 min-w-[700px] overflow-x-auto'>
          <div
            id='calendar-week-grid'
            className='border border-[#3c2518]/45 rounded-3xl overflow-hidden bg-[#130d0a]/30 backdrop-blur-2xl shadow-2xl flex flex-col'
          >
          {/* Calendar Headers columns */}
          <div className='grid grid-cols-[44px_repeat(7,1fr)] md:grid-cols-[60px_repeat(7,1fr)] border-b border-[#3c2518]/45 bg-[#1a0f0a]/75 backdrop-blur-md relative z-10 sticky top-0'>
            {/* Hour marker blank header */}
            <div className='border-r border-[#3c2518]/45 flex items-center justify-center text-[10px] font-mono text-[#ecd0b9]/55 font-bold uppercase'>
              TIME
            </div>

            {weekDays.map((dateObj, idx) => {
              const dayStr = formatDateYYYYMMDD(dateObj);
              const totalMins = getDailyTotalMinutes(dayStr);
              const formattedDateStr = formatDateYYYYMMDD(new Date());
              const isToday = dayStr === formattedDateStr;

              return (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-[#3c2518]/30 last:border-r-0 flex flex-col items-center justify-between gap-1
                    ${isToday ? "bg-[#a66e46]/10" : ""}`}
                >
                  <p
                    className={`text-[9px] md:text-[11px] font-bold tracking-wider uppercase ${isToday ? "text-[#dda67a] font-extrabold" : "text-[#ecd0b9]/55"}`}
                  >
                    {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>

                  <p
                    className={`h-6 w-6 text-xs md:h-8 md:w-8 md:text-sm rounded-full font-display font-semibold flex items-center justify-center mt-1
                    ${
                      isToday
                        ? "bg-[#a66e46] text-[#fff6f0] shadow-md shadow-[#4a2b16]/40"
                        : "text-[#ecd0b9]"
                    }`}
                  >
                    {dateObj.getDate()}
                  </p>

                  {/* Daily Log total hours */}
                  <div
                    className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[8px] md:text-[10px] font-mono font-bold tracking-wide
                    ${
                      totalMins > 0
                        ? totalMins >= 480
                          ? "bg-emerald-800/25 text-emerald-400 border border-emerald-500/15"
                          : "bg-[#4a2d1a]/40 text-[#ecd0b9] border border-[#a66e46]/30"
                        : "text-[#ecd0b9]/30"
                    }`}
                  >
                    {totalMins > 0 ? formatMinutesHHMM(totalMins) : "0:00"}
                  </div>

                  {/* Highlighting under-logged hours for workdays */}
                  {idx < 5 && totalMins > 0 && totalMins < 480 && (
                    <span className='text-[9px] font-mono text-[#ecd0b9]/45 leading-none'>
                      <span className='hidden md:inline'>under target (8h)</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid Rows body area */}
          <div
            ref={gridBodyRef}
            className='relative overflow-y-visible'
            style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}
            onDragOver={handleGridDragOver}
            onDrop={handleGridDrop}
            onDragLeave={() => setDragGhostPosition(null)}
          >
            {/* Background hourly lines */}
            {HOURS.map((hour, idx) => (
              <div
                key={hour}
                className='absolute w-full flex items-center border-b border-white/20 dark:border-slate-800/20 pointer-events-none'
                style={{ top: `${idx * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
              >
                {/* Visual Hour Indicator Column */}
                <div className='w-[44px] md:w-[60px] h-full border-r border-white/30 dark:border-slate-800/30 shrink-0 flex items-start justify-center pt-1.5'>
                  <span className='text-[10px] font-mono dark:text-slate-500 text-slate-400 font-semibold select-none'>
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>

                {/* Day separation background helper grids (just for empty click references) */}
                <div className='flex-1 grid grid-cols-7 h-full'>
                  {Array.from({ length: 7 }).map((_, dIdx) => (
                    <div
                      key={dIdx}
                      onClick={() => handleSlotClicked(formattedWeekDays[dIdx], hour)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                      onDrop={handleGridDrop}
                      className={`border-r border-white/20 dark:border-slate-800/20 last:border-r-0 pointer-events-auto cursor-cell transition duration-75 relative
                        ${draggedEntryId ? 'hover:bg-[#a66e46]/10' : 'hover:bg-white/40 dark:hover:bg-white/[0.02]'}`}
                      title='Click slot to log hours'
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Logged blocks stacked absolutely on the scheduler framework */}
            <div className='absolute left-[44px] md:left-[60px] right-0 top-0 bottom-0 pointer-events-none grid grid-cols-7 h-full'>
              {formattedWeekDays.map((dayString, dIndex) => {
                const dayEntries = getDailyEntries(dayString);

                return (
                  <div
                    key={dayString}
                    style={{ gridColumnStart: dIndex + 1 }}
                    className='h-full relative px-1'
                  >
                    <AnimatePresence initial={false}>
                      {dayEntries.map((entry) => {
                        const proj = entry.projectId
                          ? projects.find((p) => p.id === entry.projectId)
                          : null;
                        const hasOverlap = checkHasOverlap(entry);
                        const pos = getEntryPositionStyles(entry);

                        const isDragging = draggedEntryId === entry.id;

                        return (
                          <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: isDragging ? 0.3 : 1, scale: isDragging ? 0.97 : 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                            draggable
                            onDragStart={(e: any) => handleEntryDragStart(entry, e)}
                            onDragEnd={handleDragEnd}
                            onClick={() => { if (!draggedEntryId) setEditingEntry(entry); }}
                            className={`absolute left-1 right-1 rounded-xl p-1.5 md:p-2.5 shadow-md flex flex-col justify-between border select-none transition-all duration-150 pointer-events-auto group overflow-hidden
                              bg-white/70 dark:bg-[#1a110d]/75 backdrop-blur-md border-white/50 dark:border-[#3d2416]/50 hover:bg-white/90 dark:hover:bg-[#251813]/90 hover:border-[#a66e46]/60 hover:shadow-lg
                              ${isDragging ? 'opacity-30 border-dashed cursor-grabbing scale-[0.97]' : 'cursor-grab hover:scale-[1.01]'}`}
                          style={{
                            ...pos,
                            borderLeft: `4px solid ${proj?.color || "#a66e46"}`,
                            borderColor: hasOverlap ? "#ef4444" : undefined,
                          }}
                        >
                          {/* Inner Content header text */}
                          <div className='min-w-0'>
                            {/* Project detail */}
                            {proj && (
                              <div className='flex items-center gap-1 mt-0.5 mb-1.5'>
                                <span
                                  className='h-2 w-2 rounded-full shrink-0'
                                  style={{ backgroundColor: proj.color }}
                                ></span>
                                <span
                                  className='text-[10px] font-display font-semibold truncate'
                                  style={{ color: proj.color }}
                                >
                                  {proj.name}
                                </span>
                              </div>
                            )}

                            {/* Description */}
                            <p className='text-[10px] md:text-xs font-semibold leading-tight max-h-[44px] overflow-hidden text-ellipsis dark:text-[#fcdbbd] text-slate-800 break-words group-hover:text-[#dda67a] transition-colors'>
                              {entry.description || "No Description"}
                            </p>
                          </div>

                          {/* Footer details + quick adjust layout icons */}
                          <div className='flex justify-between items-end mt-2 pt-1 border-t border-white/20 dark:border-[#3d2416]/50'>
                            <span className='text-[10px] font-mono text-[#ecd0b9] font-bold shrink-0'>
                              {formatHoursAndMinutes(entry.durationMinutes)}
                            </span>

                            {/* Overlap flag indicator */}
                            {hasOverlap && (
                              <div
                                className='flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-bold'
                                title='Overlapping timeline! Adjust to avoid conflict.'
                              >
                                <AlertTriangle className='h-3 w-3 shrink-0' />
                                <span className='hidden sm:inline'>Overlap</span>
                              </div>
                            )}
                          </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Drag ghost preview indicator — positioned absolutely outside the grid to avoid displacing columns */}
            {dragGhostPosition && draggedEntryId && (() => {
              const ghostStyles = getGhostStyles();
              if (!ghostStyles) return null;
              const draggedEntry = entries.find(e => e.id === draggedEntryId);
              const proj = draggedEntry?.projectId ? projects.find(p => p.id === draggedEntry.projectId) : null;
              const hourColWidth = window.innerWidth >= 768 ? 60 : 44;
              const dayAreaWidth = gridBodyRef.current ? gridBodyRef.current.offsetWidth - hourColWidth : 0;
              const colWidthPx = dayAreaWidth / 7;
              const colLeftPx = hourColWidth + dragGhostPosition.dayIndex * colWidthPx;
              return (
                <div
                  className='absolute pointer-events-none px-1'
                  style={{
                    left: `${colLeftPx}px`,
                    width: `${colWidthPx}px`,
                    top: ghostStyles.top,
                    height: ghostStyles.height,
                  }}
                >
                  <div
                    className='h-full w-full rounded-xl border-2 border-dashed border-[#dda67a]/70 bg-[#a66e46]/15 backdrop-blur-sm flex flex-col justify-center items-center'
                    style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: proj?.color || '#a66e46' }}
                  >
                    <span className='text-[10px] font-mono font-bold text-[#dda67a]/90'>
                      {(() => {
                        const startMins = Math.round(dragGhostPosition.startHour * 60);
                        const endMins = startMins + (draggedEntry?.durationMinutes || 60);
                        const sH = Math.floor(startMins / 60);
                        const sM = startMins % 60;
                        const eH = Math.floor(endMins / 60);
                        const eM = endMins % 60;
                        return `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')} – ${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
                      })()}
                    </span>
                    <span className='text-[9px] text-[#ecd0b9]/50 mt-0.5 truncate px-2 max-w-full'>
                      {draggedEntry?.description || 'Untitled'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
        
        {/* Mobile Floating Action Button (FAB) for adding entry */}
        <button
          onClick={() => {
            const activeDayStr = formattedWeekDays[activeDayIndex] || formattedWeekDays[0];
            setNewEntryDate(activeDayStr);
            setNewEntryStartTime("09:00");
            setNewEntryEndTime("10:00");
            setModalDurationStr("1:00");
            setModalSelectedTags([]);
            setShowModalTagDropdown(false);
            setIsCreateModalOpen(true);
          }}
          className='md:hidden fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full bg-[#a66e46] hover:bg-[#8e5a34] text-white flex items-center justify-center shadow-lg shadow-[#4a2b16]/50 cursor-pointer active:scale-95 transition-all duration-150'
          title='Add Time Entry'
        >
          <Plus className='h-6 w-6' />
        </button>
      </div>

      {/* 4. Edit Detail Dialog Modal overlay */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingEntry(null);
              }
            }}
            className='fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50'
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { type: "spring", damping: 25, stiffness: 350 }
              }}
              exit={{ scale: 0.95, y: 15, opacity: 0, transition: { duration: 0.15 } }}
              className='bg-[#140d09] rounded-2xl w-full max-w-full md:max-w-[620px] max-h-[90vh] overflow-y-auto p-6 border border-[#3e271a] shadow-2xl relative text-white backdrop-blur-3xl'
            >
            <h3 className='text-base font-display font-bold text-white flex items-center gap-2 mb-4'>
              <Sparkles className='h-5 w-5 text-[#dda67a]' />
              <span>Modify Time Entry</span>
            </h3>

            <div className='space-y-4'>
              {/* Description */}
              <div>
                <label className='text-xs font-semibold text-[#ecd0b9]/60 block mb-1'>
                  Description / Task Name
                </label>
                <textarea
                  value={editingEntry.description}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, description: e.target.value })
                  }
                  className='w-full text-sm p-2.5 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] focus:ring-2 focus:ring-[#dda67a]/40 outline-none h-20 resize-y'
                />
              </div>

              {/* Project */}
              <div>
                <label className='text-xs font-semibold text-[#ecd0b9]/60 block mb-1'>
                  Project Alignment
                </label>
                <div className='relative'>
                  <select
                    value={editingEntry.projectId || ""}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, projectId: e.target.value || undefined })
                    }
                    className='w-full text-sm p-3 rounded-xl border border-[#3e271a] bg-[#1d1410] text-[#fcdbbd] outline-none cursor-pointer focus:ring-2 focus:ring-[#dda67a]/40 appearance-none pr-8 font-semibold'
                  >
                    <option value='' className='bg-[#140d09] text-[#ecd0b9]/60'>
                      No Project
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className='bg-[#1d1410] text-[#fcdbbd]'>
                        {p.name} {p.client ? `(${p.client})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className='absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#ecd0b9]/60'>
                    <ChevronRight className='h-4 w-4 rotate-90' />
                  </div>
                </div>
              </div>

              {/* Tags checkboxes */}
              <div>
                <label className='text-xs font-semibold text-[#ecd0b9]/60 block mb-1.5'>
                  Category Tags
                </label>
                <div className='flex flex-wrap gap-1.5'>
                  {tags.map((t) => {
                    const selected = editingEntry.tags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type='button'
                        onClick={() => {
                          const updatedTags = selected
                            ? editingEntry.tags.filter((tg) => tg !== t.name)
                            : [...editingEntry.tags, t.name];
                          setEditingEntry({ ...editingEntry, tags: updatedTags });
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer border transition-colors
                          ${
                            selected
                              ? "bg-[#a66e46] border-[#a66e46] text-white shadow-md"
                              : "bg-[#221611]/60 border-[#3d2416]/80 text-[#ecd0b9]/70 hover:bg-[#342118]/60 hover:text-white"
                          }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time and date section */}
              <div className='space-y-2'>
                <label className='text-xs font-semibold text-[#ecd0b9]/60 block'>
                  Time and date
                </label>

                <div className='flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#120b07] p-3 rounded-xl border border-[#3e271a]/50'>
                  {/* Dynamic Duration Box */}
                  <input
                    type='text'
                    value={editDurationStr}
                    onChange={(e) => handleEditDurationStrChange(e.target.value)}
                    placeholder='1:00'
                    className='bg-[#241610] border border-[#3e271a] px-3 py-2 rounded-lg text-base font-bold text-[#dda67a] w-[90px] text-center font-mono outline-none focus:border-[#dda67a] transition shadow-inner'
                    title='Edit duration (H:MM) to update end time automatically'
                  />

                  {/* Dotted separator */}
                  <div className='hidden sm:block h-6 border-l border-dashed border-[#3e271a]/50' />

                  {/* Horizontal Time Input Interval Wrapper */}
                  <div className='flex items-center gap-2'>
                    <input
                      type='time'
                      required
                      value={editingEntry.startTime}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const newDur = calculateDurationMinutes(newStart, editingEntry.endTime);
                        setEditingEntry({
                          ...editingEntry,
                          startTime: newStart,
                          durationMinutes: newDur,
                        });
                        setEditDurationStr(formatMinutesHHMM(newDur));
                      }}
                      className='bg-[#1c120c] border border-[#3e271a] rounded-lg px-3 py-2 text-sm text-center font-bold font-mono text-white outline-none w-[95px] focus:border-[#dda67a] transition cursor-pointer'
                    />
                    <span className='text-[#ecd0b9]/50'>-</span>
                    <input
                      type='time'
                      required
                      value={editingEntry.endTime}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const newDur = calculateDurationMinutes(editingEntry.startTime, newEnd);
                        setEditingEntry({
                          ...editingEntry,
                          endTime: newEnd,
                          durationMinutes: newDur,
                        });
                        setEditDurationStr(formatMinutesHHMM(newDur));
                      }}
                      className='bg-[#1c120c] border border-[#3e271a] rounded-lg px-3 py-2 text-sm text-center font-bold font-mono text-white outline-none w-[95px] focus:border-[#dda67a] transition cursor-pointer'
                    />
                  </div>

                  {/* Calendar symbol icon */}
                  <Calendar className='h-4 w-4 text-[#ecd0b9]/50 shrink-0' />

                  {/* Date selection picker */}
                  <input
                    type='date'
                    required
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                    className='bg-[#1c120c] border border-[#3e271a] rounded-lg px-3 py-2 text-xs text-center font-bold text-white outline-none flex-1 focus:border-[#dda67a] transition cursor-pointer'
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 border-t border-[#3e271a]/60 pt-4'>
              <button
                onClick={() => {
                  onDeleteEntry(editingEntry.id);
                  setEditingEntry(null);
                }}
                className='py-2.5 px-4 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition w-full sm:w-auto'
              >
                <Trash2 className='h-4 w-4' />
                <span>Delete</span>
              </button>

              <div className='flex gap-2'>
                <button
                  onClick={() => setEditingEntry(null)}
                  className='py-2.5 px-4 rounded-xl border border-[#3e271a] bg-[#241610] text-[#ecd0b9] hover:bg-[#341f17] text-xs font-semibold cursor-pointer transition'
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateEntry(editingEntry);
                    setEditingEntry(null);
                  }}
                  className='py-2.5 px-5 rounded-xl bg-[#a66e46] text-white hover:bg-[#8e5a34] text-xs font-semibold cursor-pointer shadow-lg shadow-[#4a2b16]/30 transition'
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* 5. Create Fast Slot entry dialog Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsCreateModalOpen(false);
                setShowModalTagDropdown(false);
              }
            }}
            className='fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50'
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ 
                scale: 1, 
                y: 0, 
                opacity: 1,
                transition: { type: "spring", damping: 25, stiffness: 350 }
              }}
              exit={{ scale: 0.95, y: 15, opacity: 0, transition: { duration: 0.15 } }}
              className='bg-[#1a110a] rounded-xl border border-[#3e271a] w-full max-w-full md:max-w-[620px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-white'
            >
            {/* Header */}
            <div className='px-6 py-4 border-b border-[#3e271a]/60 flex items-center justify-between'>
              <h3 className='text-lg font-medium text-white tracking-tight'>Add time entry</h3>
              <button
                type='button'
                onClick={() => setIsCreateModalOpen(false)}
                className='p-1.5 rounded-md hover:bg-[#2c1a11]/50 text-[#ecd0b9]/60 hover:text-white transition cursor-pointer'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const desc = fd.get("description") as string;
                const projVal = fd.get("projectId") as string;

                onAddEntry({
                  description: desc || "Untitled Task",
                  projectId: projVal || undefined,
                  tags: modalSelectedTags,
                  date: newEntryDate,
                  startTime: newEntryStartTime,
                  endTime: newEntryEndTime,
                  durationMinutes: calculateDurationMinutes(newEntryStartTime, newEntryEndTime),
                });

                setIsCreateModalOpen(false);
                setShowModalTagDropdown(false);
              }}
              className='p-6 space-y-5'
            >
              {/* Time and date section */}
              <div className='space-y-2'>
                <label className='text-xs font-semibold text-[#ecd0b9]/75 block'>
                  Time and date
                </label>

                <div className='flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#120b07] p-3 rounded border border-[#3e271a]/50'>
                  {/* Dynamic Duration Box */}
                  <input
                    type='text'
                    value={modalDurationStr}
                    onChange={(e) => handleDurationStrChange(e.target.value)}
                    placeholder='1:00'
                    className='bg-[#241610] border border-[#3e271a] px-3 py-2 rounded text-base font-bold text-[#dda67a] w-[90px] text-center font-mono outline-none focus:border-[#dda67a] transition shadow-inner'
                    title='Edit duration (H:MM) to update end time automatically'
                  />

                  {/* Dotted separator */}
                  <div className='hidden sm:block h-6 border-l border-dashed border-[#3e271a]/50' />

                  {/* Horizontal Time Input Interval Wrapper */}
                  <div className='flex items-center gap-2'>
                    <input
                      type='time'
                      required
                      value={newEntryStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className='bg-[#1c120c] border border-[#3e271a] rounded px-3 py-2 text-sm text-center font-bold font-mono text-white outline-none w-[95px] focus:border-[#dda67a] transition cursor-pointer'
                    />
                    <span className='text-[#ecd0b9]/50'>-</span>
                    <input
                      type='time'
                      required
                      value={newEntryEndTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className='bg-[#1c120c] border border-[#3e271a] rounded px-3 py-2 text-sm text-center font-bold font-mono text-white outline-none w-[95px] focus:border-[#dda67a] transition cursor-pointer'
                    />
                  </div>

                  {/* Calendar symbol icon */}
                  <Calendar className='h-4 w-4 text-[#ecd0b9]/50 shrink-0' />

                  {/* Date selection picker */}
                  <input
                    type='date'
                    required
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className='bg-[#1c120c] border border-[#3e271a] rounded px-3 py-2 text-xs text-center font-bold text-white outline-none flex-1 focus:border-[#dda67a] transition cursor-pointer'
                  />
                </div>
              </div>

              {/* Divider spacer line */}
              <hr className='border-[#3e271a]/40 my-4' />

              {/* Description field */}
              <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
                <label className='text-sm font-semibold text-[#ecd0b9]/75 sm:w-[120px] pt-1.5 shrink-0'>
                  Description
                </label>
                <textarea
                  name='description'
                  required
                  placeholder='What have you worked on?'
                  className='flex-1 bg-[#1c120c] border border-[#3e271a] rounded p-3 h-20 text-sm text-white placeholder-[#ecd0b9]/30 outline-none focus:border-[#dda67a] transition'
                />
              </div>

              {/* Project field */}
              <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                <label className='text-sm font-semibold text-[#ecd0b9]/75 sm:w-[120px] shrink-0'>
                  Project
                </label>
                <div className='relative flex-1'>
                  <input type='hidden' name='projectId' value={projects[0]?.id || ""} />
                  <div className='w-full bg-[#1c120c] border border-[#3e271a] rounded p-3 text-sm text-[#ecd0b9] font-medium flex items-center gap-2 select-none'>
                    <span
                      className='h-2.5 w-2.5 rounded-full'
                      style={{ backgroundColor: projects[0]?.color || "#a66e46" }}
                    />
                    <span>{projects[0]?.name || "Tyme Project"}</span>
                  </div>
                </div>
              </div>

              {/* Tags field */}
              <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
                <label className='text-sm font-semibold text-[#ecd0b9]/75 sm:w-[120px] pt-1.5 shrink-0'>
                  Tags
                </label>
                <div className='relative flex-1'>
                  {/* Select Dropdown Box Trigger */}
                  <button
                    type='button'
                    onClick={() => setShowModalTagDropdown(!showModalTagDropdown)}
                    className='w-full text-left bg-[#1c120c] border border-[#3e271a] rounded p-3 pr-10 text-sm text-white focus:border-[#dda67a] flex items-center justify-between cursor-pointer transition hover:border-[#3e271a]/80'
                  >
                    {modalSelectedTags.length > 0 ? (
                      <div className='flex flex-wrap gap-1.5 max-w-[calc(100%-20px)]'>
                        {modalSelectedTags.map((tag) => (
                          <span
                            key={tag}
                            className='px-2 py-0.5 rounded text-[11px] font-medium bg-[#2f1d13] text-[#ecd0b9] border border-[#3e271a]/50 flex items-center gap-1'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className='text-[#ecd0b9]/30'>Add tags</span>
                    )}
                    <span className='text-[#ecd0b9]/60'>
                      <svg className='h-4 w-4 fill-current' viewBox='0 0 20 20'>
                        <path d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown popup menu checklist */}
                  {showModalTagDropdown && (
                    <div className='absolute left-0 right-0 mt-1 bg-[#1a110a] border border-[#3e271a] rounded-md shadow-2xl z-50 max-h-45 overflow-y-auto p-2 space-y-1'>
                      {tags.map((t) => {
                        const active = modalSelectedTags.includes(t.name);
                        return (
                          <button
                            type='button'
                            key={t.id}
                            onClick={() => {
                              if (active) {
                                setModalSelectedTags((prev) => prev.filter((x) => x !== t.name));
                              } else {
                                setModalSelectedTags((prev) => [...prev, t.name]);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded transition flex items-center justify-between cursor-pointer
                              ${active ? "bg-[#2f1d13] text-white font-semibold" : "text-[#ecd0b9]/70 hover:bg-[#2c1a11]/40 hover:text-white"}`}
                          >
                            <span>{t.name}</span>
                            {active && <Check className='h-3 w-3 text-[#dda67a]' />}
                          </button>
                        );
                      })}
                      {tags.length === 0 && (
                        <div className='p-2 text-xs text-[#ecd0b9]/40 italic text-center'>
                          No workspace tags. Setup tags in Settings!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer CTA */}
              <div className='flex flex-col-reverse sm:flex-row gap-6 items-center justify-end mt-8 pt-4 border-t border-[#3e271a]/40'>
                <button
                  type='button'
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setShowModalTagDropdown(false);
                  }}
                  className='text-[#dda67a] hover:text-[#ecd0b9] text-sm font-semibold cursor-pointer transition bg-transparent border-none outline-none py-2 px-1'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='bg-[#a66e46] hover:bg-[#8e5a34] text-white uppercase text-xs font-bold py-3 px-8 rounded transition cursor-pointer tracking-wider shadow-lg shadow-[#4a2b16]/40'
                >
                  ADD
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}
