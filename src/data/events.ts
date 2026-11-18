// Event types. The events themselves live in content/events.json and are
// managed from the admin (/admin/events).

export type EventType = 'Tournament' | 'Competition' | 'Clinic' | 'Community';

export interface EventItem {
  slug: string;
  title: string;
  type: EventType;
  /** ISO date (YYYY-MM-DD) of the first/only day. */
  date: string;
  /** Optional ISO end date for multi-week events. */
  endDate?: string;
  /** 24h times, Sydney local time. */
  startTime: string;
  endTime: string;
  /** Shown alongside the date for recurring sessions, e.g. "Every Wednesday". */
  recurring?: string;
  venue: string;
  suburb: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  description: string[];
  price: string;
  level: string;
  format?: string;
  includes?: string[];
  ctaLabel: string;
  cta: 'register' | 'enquire';
  featured?: boolean;
  /** Drafts are only visible to logged-in admins. */
  draft?: boolean;
}

export const eventTypes: { value: EventType; label: string }[] = [
  { value: 'Tournament', label: 'Tournaments' },
  { value: 'Competition', label: 'Competitions' },
  { value: 'Clinic', label: 'Clinics' },
  { value: 'Community', label: 'Community' },
];
