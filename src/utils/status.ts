import { statusConfig } from '../config';
import { generateId } from './id';
import type { Status, HistoryEntry } from '../types';

/**
 * Computes the side effects of moving a topic to a new status:
 * - Progress auto-adjusts to 100 when completed, 0 when moved back to "to learn",
 *   and is left untouched for any other transition.
 * - A 'moved' history entry is built using the human-readable status labels.
 *
 * Shared by both places a topic's status can change — the drawer's status
 * dropdown and drag-and-drop between Kanban columns — so the two paths can't
 * silently disagree on what a status change means (see DL-014).
 */
export function computeStatusChange(
  topic: { status: Status; progress: number },
  newStatus: Status,
): { progress: number; historyEntry: HistoryEntry } {
  const progress =
    newStatus === 'completed' ? 100 :
    newStatus === 'to_learn' ? 0 :
    topic.progress;

  const historyEntry: HistoryEntry = {
    id: generateId('h'),
    action: 'moved',
    detail: `${statusConfig[topic.status].label} → ${statusConfig[newStatus].label}`,
    date: new Date().toISOString(),
  };

  return { progress, historyEntry };
}
