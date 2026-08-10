import type { Topic, CalendarEvent } from '../types';

const HEATMAP_CELLS = 252; // 36 weeks × 7 days

/**
 * Builds the 252-cell activity heatmap from topic update/create timestamps.
 * Each cell is 0-4 (intensity level).
 */
export function generateHeatmap(topics: Topic[]): number[] {
  const days: number[] = new Array(HEATMAP_CELLS).fill(0);
  const now = new Date();

  for (const t of topics) {
    const d = new Date(t.updatedAt);
    const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    const idx = HEATMAP_CELLS - 1 - daysAgo;
    if (idx >= 0 && idx < HEATMAP_CELLS) {
      days[idx] = Math.min(4, days[idx] + 1);
    }

    const cd = new Date(t.createdAt);
    const cDaysAgo = Math.floor((now.getTime() - cd.getTime()) / (1000 * 60 * 60 * 24));
    const cIdx = HEATMAP_CELLS - 1 - cDaysAgo;
    if (cIdx >= 0 && cIdx < HEATMAP_CELLS && days[cIdx] < 2) {
      days[cIdx] = Math.min(4, days[cIdx] + 1);
    }
  }

  return days;
}

/**
 * Returns the count of topic updates per week for the last 12 weeks.
 * Activity is real: counted from updatedAt timestamps, no random padding.
 */
export function generateWeeklyActivity(topics: Topic[]): { week: string; count: number }[] {
  const weeks: { week: string; count: number }[] = [];
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = topics.filter((t) => {
      const d = new Date(t.updatedAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;
    weeks.push({ week: label, count });
  }

  return weeks;
}

/**
 * Computes the current and best learning streak.
 * A streak day requires at least one topic updated on that calendar day.
 * Returns { current, best } in days.
 */
export function computeStreak(topics: Topic[]): { current: number; best: number } {
  if (topics.length === 0) return { current: 0, best: 0 };

  // Collect unique active calendar days (YYYY-MM-DD) from updatedAt
  const activeDays = new Set<string>();
  for (const t of topics) {
    const d = new Date(t.updatedAt);
    if (!isNaN(d.getTime())) {
      activeDays.add(d.toISOString().slice(0, 10));
    }
  }

  const sorted = Array.from(activeDays).sort();
  if (sorted.length === 0) return { current: 0, best: 0 };

  // Walk the sorted days and compute runs
  let bestRun = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentRun++;
      bestRun = Math.max(bestRun, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Check if the streak is still active (last activity was today or yesterday)
  const lastDay = new Date(sorted[sorted.length - 1]);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

  const lastDayStr = lastDay.toISOString().slice(0, 10);
  const isActive = lastDayStr === todayStr || lastDayStr === yesterdayStr;

  return {
    current: isActive ? currentRun : 0,
    best: bestRun,
  };
}

/**
 * Builds calendar events from topic review dates.
 */
export function generateCalendarEvents(topics: Topic[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const t of topics) {
    if (t.reviewDate) {
      events.push({
        date: t.reviewDate,
        type: t.status === 'completed' ? 'completed' : 'review',
        topicId: t.id,
        title: t.title,
      });
    }
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}
