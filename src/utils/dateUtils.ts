/**
 * Timezone utilities for STUDY SQUAD.
 * All daily plans use the 'Asia/Kolkata' timezone (IST, UTC+5:30).
 */

const TIMEZONE_IST = 'Asia/Kolkata';

/**
 * Returns today's date in YYYY-MM-DD format strictly in Asia/Kolkata timezone.
 */
export function getTodayDateIST(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA outputs YYYY-MM-DD
}

/**
 * Format a YYYY-MM-DD date into a readable string (e.g., "Saturday, 3 Oct 2026")
 */
export function formatPlanDateIST(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date with UTC noon to avoid date shifting
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_IST,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format a full ISO timestamp to IST readable string (e.g., "11:45 AM, 3 Oct")
 */
export function formatTimestampIST(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_IST,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

/**
 * Check if a given YYYY-MM-DD string is today in IST.
 */
export function isTodayDateIST(dateStr: string): boolean {
  return dateStr === getTodayDateIST();
}

/**
 * Get start of current week in YYYY-MM-DD (Monday) in IST
 */
export function getStartOfWeekIST(): string {
  const today = getTodayDateIST();
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  // day 0 is Sunday, day 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

/**
 * Get start of current month in YYYY-MM-DD in IST
 */
export function getStartOfMonthIST(): string {
  const today = getTodayDateIST();
  return `${today.slice(0, 7)}-01`;
}
