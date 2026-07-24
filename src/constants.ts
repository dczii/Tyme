// Shared preset palette for project color indicators
export const PROJECT_COLORS = [
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
];

// --- Feedback survey (/feedback) -------------------------------------------
// Roadmap candidates users vote on with their wallet. `id` values are persisted
// in feedback.features, so rename labels freely but never reuse or repurpose an id.
export const PAYWALL_FEATURES = [
  { id: 'team', label: 'Team & multi-seat', description: 'Invite teammates, share projects, see who tracked what.' },
  { id: 'invoicing', label: 'Invoicing & payments', description: 'Turn tracked hours into a sendable, payable invoice.' },
  { id: 'integrations', label: 'Integrations', description: 'Two-way sync with Jira, Asana, Trello, GitHub, Notion.' },
  { id: 'mobile', label: 'Native mobile app', description: 'iOS and Android tracking that works offline.' },
  { id: 'auto_tracking', label: 'Automatic tracking', description: 'Idle detection and suggested entries from app usage.' },
  { id: 'project_rates', label: 'Per-project rates', description: 'A different hourly rate per project or client.' },
  { id: 'client_portal', label: 'Client portal', description: 'Share a live, read-only dashboard with a client.' },
  { id: 'scheduled_reports', label: 'Scheduled reports', description: 'Weekly or monthly PDFs emailed out automatically.' },
  { id: 'api', label: 'API & webhooks', description: 'Pipe your time data anywhere you need it.' },
  { id: 'analytics', label: 'Advanced analytics', description: 'Profitability, utilization and capacity dashboards.' },
] as const;

// Monthly willingness-to-pay bands. Same rule: ids are persisted, labels are not.
export const PRICE_BANDS = [
  { id: 'free', label: 'Free only', hint: "I'd stay on the free plan" },
  { id: 'under_5', label: 'Up to $5', hint: 'per month' },
  { id: 'five_to_ten', label: '$5 – $10', hint: 'per month' },
  { id: 'ten_to_twenty', label: '$10 – $20', hint: 'per month' },
  { id: 'twenty_plus', label: '$20+', hint: 'per month' },
] as const;

export const PAYWALL_FEATURE_IDS: string[] = PAYWALL_FEATURES.map(f => f.id);
export const PRICE_BAND_IDS: string[] = PRICE_BANDS.map(b => b.id);
