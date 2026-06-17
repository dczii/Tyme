export interface Project {
  id: string;
  name: string;
  client?: string;
  color: string; // Tailwind color class or hex values
}

export interface Tag {
  id: string;
  name: string;
}

export interface TimeEntry {
  id: string;
  description: string;
  projectId?: string;
  tags: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  durationMinutes: number; // calculated field
}

export type PageView = 'calendar' | 'reports' | 'settings';

export interface ReportFilter {
  datePreset: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  projectIds: string[];
  tags: string[];
  searchQuery: string;
}

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  hourlyRate?: number;
}
