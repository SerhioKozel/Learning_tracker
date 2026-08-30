import { statusConfig, difficultyConfig } from '../config';
import { generateId } from './id';
import type { Status, Difficulty, Topic, HistoryEntry } from '../types';

/**
 * Computes the side effects of moving a topic to a new status:
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

// Fields tracked in history. Checklist, resources, notes and status are excluded:
// status changes go through computeStatusChange; the others are too noisy.
type TrackedField = 'title' | 'description' | 'difficulty' | 'deadlineDate' | 'tags';

const FIELD_LABELS: Record<TrackedField, string> = {
  title:       'Title',
  description: 'Description',
  difficulty:  'Difficulty',
  deadlineDate:'Deadline',
  tags:        'Tags',
};

function formatValue(field: TrackedField, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'difficulty') return difficultyConfig[value as Difficulty]?.label ?? String(value);
  if (field === 'tags') return (value as string[]).join(', ') || '—';
  if (field === 'deadlineDate') return String(value);
  const s = String(value);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

/**
 * Compares new field values against the current topic and returns 'updated'
 * history entries for every tracked field that changed.
 * Returns an empty array if nothing tracked changed.
 */
export function computeFieldUpdates(
  current: Topic,
  updates: Partial<Pick<Topic, TrackedField>>,
): HistoryEntry[] {
  const now = new Date().toISOString();
  const entries: HistoryEntry[] = [];

  for (const key of Object.keys(updates) as TrackedField[]) {
    if (!(key in FIELD_LABELS)) continue;

    const oldVal = current[key];
    const newVal = updates[key];

    // Deep-equal check: use JSON for arrays (tags), strict === for primitives
    const changed = Array.isArray(oldVal)
      ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
      : oldVal !== newVal;

    if (!changed) continue;

    entries.push({
      id: generateId('h'),
      action: 'updated',
      detail: `${FIELD_LABELS[key]}: ${formatValue(key, oldVal)} → ${formatValue(key, newVal)}`,
      date: now,
    });
  }

  return entries;
}
