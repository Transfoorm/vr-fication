/** Get time bucket for grouping messages */
export function getTimeBucket(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= thisWeekStart) return 'This Week';
  if (date >= lastWeekStart) return 'Last Week';
  if (date >= thisMonthStart) return 'This Month';
  if (date >= lastMonthStart) return 'Last Month';
  return 'Older';
}

/** Format date like Outlook Web: today=time, recent=day+time, older=day+date */
export function formatThreadDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayDate = `${date.getDate()}/${date.getMonth() + 1}`;

  if (date >= today) {
    // Today: just time
    return time;
  } else if (date >= yesterday) {
    // Yesterday: day + time
    return `${dayShort} ${time}`;
  } else if (date >= oneWeekAgo) {
    // Within a week: day + time
    return `${dayShort} ${time}`;
  } else {
    // Older: day + date
    return `${dayShort} ${dayDate}`;
  }
}

// localStorage keys for persisted column widths
export const STORAGE_KEY_MAILBOX = 'email-column-mailbox';
export const STORAGE_KEY_THREADS = 'email-column-threads';

/** Get saved width from localStorage (SSR-safe) */
export function getSavedWidth(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : defaultValue;
}

/** Standard canonical folder types */
export const STANDARD_FOLDERS = ['inbox', 'drafts', 'sent', 'archive', 'spam', 'trash'];
