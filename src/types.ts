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

export type PageView = 'calendar' | 'reports' | 'settings' | 'feedback';

/**
 * A submission is one thing or the other, never both:
 * 'review'   → a star rating plus written thoughts
 * 'features' → which features they'd pay for, and what it's worth
 */
export type FeedbackKind = 'review' | 'features';

/** What a user submits from the /feedback survey. */
export interface FeedbackDraft {
  kind: FeedbackKind;
  name: string; // who to reply to (prefilled from the profile, editable)
  email: string;
  rating: number; // 1-5 stars; 0 when kind === 'features'
  review: string; // free-text review; '' when kind === 'features'
  features: string[]; // ids from PAYWALL_FEATURES; [] when kind === 'review'
  otherFeature: string; // free-text "something else" wish
  priceBand: string; // id from PRICE_BANDS; '' when kind === 'review'
}


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
