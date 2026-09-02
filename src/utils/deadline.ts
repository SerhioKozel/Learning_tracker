export type DeadlineUrgency = 'overdue' | 'soon' | 'normal';

/**
 * Parses a 'YYYY-MM-DD' date string as a LOCAL date, not UTC.
 *
 * `new Date('YYYY-MM-DD')` parses as UTC midnight, while `new Date().toDateString()`
 * parses as LOCAL midnight — comparing the two directly is off by the user's
 * UTC offset (e.g. a deadline set to "today" could read as tomorrow or
 * yesterday depending on timezone). This avoids that mismatch entirely.
 */
export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Classifies a deadline into an urgency tier, or null if there is no deadline.
 *  - overdue: today or in the past — needs attention now
 *  - soon:    within the next 3 days — coming up
 *  - normal:  further out — plenty of runway
 */
export function getDeadlineUrgency(deadlineDate: string | null): DeadlineUrgency | null {
  if (!deadlineDate) return null;
  const todayLocal = new Date(new Date().toDateString());
  const daysUntil = Math.round(
    (parseLocalDate(deadlineDate).getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntil <= 0) return 'overdue';
  if (daysUntil <= 3) return 'soon';
  return 'normal';
}

/** Formats a 'YYYY-MM-DD' deadline for display, e.g. "1 Sep 2026". */
export function formatDeadline(deadlineDate: string): string {
  return parseLocalDate(deadlineDate).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
