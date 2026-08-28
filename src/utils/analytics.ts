import type { Topic, CalendarEvent } from '../types';

const HEATMAP_CELLS = 252; // 36 weeks × 7 days

/**
 * Returns all study activity dates from a topic's history.
 * Only 'moved' and 'updated' actions count as real learning activity.
 * 'created' is excluded — adding a topic is not studying it.
 */
export function getStudyDates(topic: Topic): Date[] {
  return topic.history
    .filter((h) => h.action === 'moved' || h.action === 'updated')
    .map((h) => new Date(h.date))
    .filter((d) => !isNaN(d.getTime()));
}

export function generateHeatmap(topics: Topic[]): number[] {
  const days: number[] = new Array(HEATMAP_CELLS).fill(0);
  const now = new Date();

  for (const t of topics) {
    for (const d of getStudyDates(t)) {
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const idx = HEATMAP_CELLS - 1 - daysAgo;
      if (idx >= 0 && idx < HEATMAP_CELLS) days[idx] = Math.min(4, days[idx] + 1);
    }
  }

  return days;
}

export function generateWeeklyActivity(
  topics: Topic[],
): { week: string; count: number; moved: number; updated: number }[] {
  const weeks: { week: string; count: number; moved: number; updated: number }[] = [];
  const now = new Date();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    let moved = 0;
    let updated = 0;

    for (const t of topics) {
      for (const h of t.history) {
        if (h.action !== 'moved' && h.action !== 'updated') continue;
        const d = new Date(h.date);
        if (d >= weekStart && d < weekEnd) {
          if (h.action === 'moved') moved++;
          else updated++;
        }
      }
    }

    weeks.push({
      week: `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`,
      count: moved + updated,
      moved,
      updated,
    });
  }

  return weeks;
}

export function computeStreak(topics: Topic[]): { current: number; best: number } {
  if (topics.length === 0) return { current: 0, best: 0 };

  // Collect all unique days with real study activity across all topics
  const activeDays = new Set<string>();
  for (const t of topics) {
    for (const d of getStudyDates(t)) {
      activeDays.add(d.toISOString().slice(0, 10));
    }
  }

  const sorted = Array.from(activeDays).sort();
  if (sorted.length === 0) return { current: 0, best: 0 };

  let bestRun = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) { currentRun++; bestRun = Math.max(bestRun, currentRun); }
    else currentRun = 1;
  }

  const lastDayStr = sorted[sorted.length - 1];
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isActive = lastDayStr === todayStr || lastDayStr === yesterdayStr;

  return { current: isActive ? currentRun : 0, best: bestRun };
}

/**
 * Finds the date when a topic was moved to 'completed'.
 * Looks for the last 'moved' history entry mentioning 'Completed',
 * falls back to updatedAtRaw.
 */
function getCompletedDate(topic: Topic): string {
  const entry = [...topic.history]
    .reverse()
    .find((h) => h.action === 'moved' && (h.detail.includes('Mastered') || h.detail.includes('Completed')));
  return entry ? entry.date.slice(0, 10) : topic.updatedAtRaw.slice(0, 10);
}

/**
 * Builds calendar events for ALL topics with deadlines or completed status.
 * Used by CalendarView grid (includes past events).
 */
export function generateAllCalendarEvents(topics: Topic[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const t of topics) {
    if (t.deadlineDate) {
      events.push({ date: t.deadlineDate, type: 'deadline', topicId: t.id, boardId: t.boardId, title: t.title });
    }
    if (t.status === 'completed') {
      const date = getCompletedDate(t);
      // Don't duplicate if deadline and completed fall on the same day
      if (!events.find((e) => e.topicId === t.id && e.date === date && e.type === 'completed')) {
        events.push({ date, type: 'completed', topicId: t.id, boardId: t.boardId, title: t.title });
      }
    }
  }

  return events.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Builds upcoming deadline events only (today + future).
 * Used by the sidebar list in CalendarView and Dashboard.
 */
export function generateCalendarEvents(topics: Topic[]): CalendarEvent[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return topics
    .filter((t) => t.deadlineDate && t.deadlineDate >= todayStr)
    .map((t) => ({ date: t.deadlineDate!, type: 'deadline' as const, topicId: t.id, boardId: t.boardId, title: t.title }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
