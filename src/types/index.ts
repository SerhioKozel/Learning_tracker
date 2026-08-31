// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  createdAt: string;
}

// ─── Domain ───────────────────────────────────────────────────────────────────

export type Status = 'to_learn' | 'learning' | 'practice' | 'review' | 'completed';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'documentation' | 'snippet' | 'other';
  url: string;
  done: boolean;
}

export interface HistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'moved' | 'progress';
  detail: string;
  date: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  status: Status;
  boardId: string;
  difficulty: Difficulty;
  tags: string[];
  /** @deprecated reviewDate is no longer used in MVP — kept for data compatibility only */
  reviewDate: string | null;
  deadlineDate: string | null;
  /** Checklist completion percentage (0-100). Computed from checklist; 0 when no checklist. */
  progress: number;
  checklist: ChecklistItem[];
  resources: Resource[];
  notes: string;
  history: HistoryEntry[];
  /** Set when this topic was copied from the Knowledge Library. Null for manually created topics. */
  libraryTopicId: string | null;
  updatedAt: string;
  updatedAtRaw: string;
  createdAt: string;
}

// ─── Knowledge Library ──────────────────────────────────────────────────────
// Global, curated topics any user can copy into their own boards.
// Deliberately minimal — no status/progress/checklist/notes/history,
// since those are per-user learning state, not library content.

export interface LibraryTopic {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type BoardColor = 'sky' | 'cyan' | 'teal' | 'emerald' | 'amber' | 'orange' | 'rose' | 'violet' | 'indigo';

export interface Board {
  id: string;
  title: string;
  description: string;
  color: BoardColor;
  icon: string;
  topicCount: number;
  completedCount: number;
  updatedAt: string;
  updatedAtRaw: string;
  createdAt: string;
}

export interface CalendarEvent {
  date: string;
  type: 'deadline' | 'completed';
  topicId: string;
  boardId: string;
  title: string;
}
