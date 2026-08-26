import { TimeEntry, Project } from './types';

// Convert minutes to a formatted string like "04:30" or "00:45"
export function formatMinutesHHMM(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Convert minutes to hours float like "4.50h" or "0.75h"
export function formatMinutesDecimal(minutes: number): string {
  return `${(minutes / 60).toFixed(2)}h`;
}

// Convert "HH:MM" (24h) string to decimal hour value
// e.g., "12:30" -> 12.5
export function timeStringToDecimal(timeStr: string): number {
  const [hrs, mins] = timeStr.split(':').map(Number);
  return hrs + mins / 60;
}

// Calculate duration in minutes between "HH:MM" and "HH:MM"
export function calculateDurationMinutes(start: string, end: string): number {
  const startDecimal = timeStringToDecimal(start);
  let endDecimal = timeStringToDecimal(end);
  
  if (endDecimal < startDecimal) {
    // Gracefully handle overnight logging (e.g. 23:00 to 01:00 is 120min)
    endDecimal += 24;
  }
  
  return Math.round((endDecimal - startDecimal) * 60);
}

// Get the Monday of the week for a given date
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
}

// Generate the 7 days of a week starting from a specific Monday Date
export function getWeekDays(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

// Pad zero helper
export function padZero(num: number): string {
  return String(num).padStart(2, '0');
}

// Resolve a report date preset to an inclusive "YYYY-MM-DD" range, relative to today
// Every range option the Reports date picker can resolve on its own.
// 'custom' is deliberately absent: it carries its own explicit start/end
// dates, so it is resolved by resolveDateRange() instead.
export type DateRangePreset =
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last7'
  | 'last30'
  | 'allTime';

export function getPresetDateRange(
  preset: DateRangePreset
): { minDateStr: string; maxDateStr: string } {
  const today = new Date();

  if (preset === 'thisWeek') {
    const monday = getMonday(today);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { minDateStr: formatDateYYYYMMDD(monday), maxDateStr: formatDateYYYYMMDD(sunday) };
  }
  if (preset === 'lastWeek') {
    const monday = getMonday(today);
    monday.setDate(monday.getDate() - 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { minDateStr: formatDateYYYYMMDD(monday), maxDateStr: formatDateYYYYMMDD(sunday) };
  }
  if (preset === 'thisMonth') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { minDateStr: formatDateYYYYMMDD(first), maxDateStr: formatDateYYYYMMDD(last) };
  }
  if (preset === 'lastMonth') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { minDateStr: formatDateYYYYMMDD(first), maxDateStr: formatDateYYYYMMDD(last) };
  }
  if (preset === 'last7') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6); // inclusive of today
    return { minDateStr: formatDateYYYYMMDD(start), maxDateStr: formatDateYYYYMMDD(today) };
  }
  if (preset === 'last30') {
    const start = new Date(today);
    start.setDate(today.getDate() - 29); // inclusive of today
    return { minDateStr: formatDateYYYYMMDD(start), maxDateStr: formatDateYYYYMMDD(today) };
  }
  // allTime
  return { minDateStr: '2000-01-01', maxDateStr: '2100-12-31' };
}

// Resolve any Reports range selection — preset or explicit custom dates —
// into the YYYY-MM-DD bounds the filters, chart axis and exports all share.
// Custom bounds are normalized so an inverted pick still yields a valid range.
export function resolveDateRange(
  preset: DateRangePreset | 'custom',
  customStart: string,
  customEnd: string
): { minDateStr: string; maxDateStr: string } {
  if (preset !== 'custom') return getPresetDateRange(preset);
  if (!customStart || !customEnd) return getPresetDateRange('thisMonth');
  return customStart <= customEnd
    ? { minDateStr: customStart, maxDateStr: customEnd }
    : { minDateStr: customEnd, maxDateStr: customStart };
}

// Format Date object to "YYYY-MM-DD"
export function formatDateYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

// Format Date object to user-friendly "Mon, Jun 15"
export function formatDateFriendly(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Quote a CSV cell and neutralize spreadsheet formula injection: cells starting
// with = + - @ or tab/CR are executed as formulas by Excel/Sheets, so prefix
// them with a single quote (OWASP recommendation).
function csvCell(value: string): string {
  let v = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v}"`;
}

// Exporter: Generate CSV file content and download
export function exportToCSV(entries: TimeEntry[], projects: Project[]) {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const headers = ['Date', 'Description', 'Project', 'Client', 'Start Time', 'End Time', 'Duration (Hours)', 'Tags'];
  const rows = entries.map(e => {
    const proj = e.projectId ? projectMap.get(e.projectId) : null;
    return [
      e.date,
      csvCell(e.description || 'No Description'),
      proj ? csvCell(proj.name) : 'None',
      proj?.client ? csvCell(proj.client) : 'None',
      e.startTime,
      e.endTime,
      (e.durationMinutes / 60).toFixed(2),
      csvCell(e.tags.join(', '))
    ];
  });
  
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `tyme-report-${formatDateYYYYMMDD(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
