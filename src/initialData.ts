import { Project, Tag, TimeEntry } from './types';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Arrived Web App', client: 'Arrived Technologies', color: '#dda67a' }
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Development' },
  { id: 'tag-2', name: 'Design' },
  { id: 'tag-3', name: 'Meeting' },
  { id: 'tag-4', name: 'Planning' },
  { id: 'tag-5', name: 'Bugfix' }
];

// Helper to stringify date as YYYY-MM-DD
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate default time entries relative to June 15, 2026, aligned with single project id 'proj-1'
export const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'entry-1',
    description: 'AR-233: fix visit spend calculation in in-the-room page. fix convex part issue',
    projectId: 'proj-1',
    tags: ['Development', 'Bugfix'],
    date: '2026-06-15',
    startTime: '12:00',
    endTime: '16:00',
    durationMinutes: 240
  },
  {
    id: 'entry-2',
    description: 'AR-202: plan with claude. AR-160: do suggested comments and fix minor bugs',
    projectId: 'proj-1',
    tags: ['Planning', 'Bugfix'],
    date: '2026-06-16',
    startTime: '12:30',
    endTime: '16:30',
    durationMinutes: 240
  },
  {
    id: 'entry-3',
    description: 'Weekly team sync & sprint planning',
    projectId: 'proj-1',
    tags: ['Meeting', 'Planning'],
    date: '2026-06-15',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60
  },
  {
    id: 'entry-4',
    description: 'Landing page typography iteration & styleguide definitions',
    projectId: 'proj-1',
    tags: ['Design'],
    date: '2026-06-17',
    startTime: '14:00',
    endTime: '17:30',
    durationMinutes: 210
  },
  {
    id: 'entry-5',
    description: 'Consulting call with NextGen client regarding cloud architecture',
    projectId: 'proj-1',
    tags: ['Meeting'],
    date: '2026-06-18',
    startTime: '10:00',
    endTime: '11:15',
    durationMinutes: 75
  },
  {
    id: 'entry-6',
    description: 'Researching WebGL shader transitions for layout visual animations',
    projectId: 'proj-1',
    tags: ['Development', 'Design'],
    date: '2026-06-19',
    startTime: '15:00',
    endTime: '18:00',
    durationMinutes: 180
  },
  {
    id: 'entry-7',
    description: 'Writing product launch documentation and press draft',
    projectId: 'proj-1',
    tags: ['Marketing'],
    date: '2026-06-16',
    startTime: '09:00',
    endTime: '11:30',
    durationMinutes: 150
  },
  // Earlier in June (for monthly aggregates)
  {
    id: 'entry-old-1',
    description: 'Initial project setup & repository bootstrap',
    projectId: 'proj-1',
    tags: ['Development'],
    date: '2026-06-01',
    startTime: '09:00',
    endTime: '14:00',
    durationMinutes: 300
  },
  {
    id: 'entry-old-2',
    description: 'Figma wireframes & information architecture design',
    projectId: 'proj-1',
    tags: ['Design'],
    date: '2026-06-02',
    startTime: '10:00',
    endTime: '14:00',
    durationMinutes: 240
  },
  {
    id: 'entry-old-3',
    description: 'Feedback integration & client presentation',
    projectId: 'proj-1',
    tags: ['Meeting'],
    date: '2026-06-04',
    startTime: '11:00',
    endTime: '16:00',
    durationMinutes: 300
  },
  {
    id: 'entry-old-4',
    description: 'Authentication logic rewrite with session persistence',
    projectId: 'proj-1',
    tags: ['Development'],
    date: '2026-06-08',
    startTime: '13:00',
    endTime: '17:00',
    durationMinutes: 240
  },
  {
    id: 'entry-old-5',
    description: 'Marketing campaign copy editing',
    projectId: 'proj-1',
    tags: ['Marketing'],
    date: '2026-06-09',
    startTime: '13:00',
    endTime: '17:00',
    durationMinutes: 240
  },
  {
    id: 'entry-old-6',
    description: 'Consulting deliverables handoff & training',
    projectId: 'proj-1',
    tags: ['Development'],
    date: '2026-06-10',
    startTime: '13:00',
    endTime: '17:00',
    durationMinutes: 240
  },
  {
    id: 'entry-old-7',
    description: 'Internal retrospective and quarterly planning sessions',
    projectId: 'proj-1',
    tags: ['Planning'],
    date: '2026-06-12',
    startTime: '14:00',
    endTime: '16:00',
    durationMinutes: 120
  }
];
