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
export function getPresetDateRange(
  preset: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'allTime'
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
  // allTime
  return { minDateStr: '2000-01-01', maxDateStr: '2100-12-31' };
}

// Format Date object to "YYYY-MM-DD"
export function formatDateYYYYMMDD(d: Date): string {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

// Format Date object to user-friendly "Mon, Jun 15"
export function formatDateFriendly(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Exporter: Generate CSV file content and download
export function exportToCSV(entries: TimeEntry[], projects: Project[]) {
  const projectMap = new Map(projects.map(p => [p.id, p]));
  
  const headers = ['Date', 'Description', 'Project', 'Client', 'Start Time', 'End Time', 'Duration (Hours)', 'Tags'];
  const rows = entries.map(e => {
    const proj = e.projectId ? projectMap.get(e.projectId) : null;
    return [
      e.date,
      `"${(e.description || 'No Description').replace(/"/g, '""')}"`,
      proj ? `"${proj.name}"` : 'None',
      proj?.client ? `"${proj.client}"` : 'None',
      e.startTime,
      e.endTime,
      (e.durationMinutes / 60).toFixed(2),
      `"${e.tags.join(', ')}"`
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
