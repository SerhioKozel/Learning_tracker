import { statusConfig } from '../config';
import { generateId } from './id';
import type { Status, HistoryEntry } from '../types';

/**
 * Progress value automatically assigned when a topic moves to a given status.
 * This is the single source of truth for status-based progress (Variant 2).
 * Manual slider is hidden in MVP — progress is always derived from status.
 */
export const STATUS_PROGRESS: Record<Status, number> = {
  to_learn:  0,
  learning:  25,
  practice:  60,
  review:    80,   // kept for data compatibility, review column is hidden in UI
  completed: 100,
};

/**
 * Computes the side effects of moving a topic to a new status:
 * - Progress auto-adjusts to the STATUS_PROGRESS value for the new status.
 * - A 'moved' history entry is built using the human-readable status labels.
 *
 * Shared by both places a topic's status can change — the drawer's status
 * pills and drag-and-drop between Kanban columns (DL-014).
 */
export function computeStatusChange(
  topic: { status: Status },
  newStatus: Status,
): { historyEntry: HistoryEntry } {
  const historyEntry: HistoryEntry = {
    id: generateId('h'),
    action: 'moved',
    detail: `${statusConfig[topic.status].label} → ${statusConfig[newStatus].label}`,
    date: new Date().toISOString(),
  };

  return { historyEntry };
}
