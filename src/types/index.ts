export type Status = 'to_learn' | 'learning' | 'practice' | 'review' | 'completed';

export type TopicType =
  | 'learning'
  | 'book'
  | 'video'
  | 'course'
  | 'documentation'
  | 'repository'
  | 'interview'
  | 'certification'
  | 'project'
  | 'custom';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'url' | 'book' | 'video' | 'documentation' | 'github';
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
  type: TopicType;
  difficulty: Difficulty;
  tags: string[];
  /** @deprecated reviewDate is no longer used in MVP — kept for data compatibility only */
  reviewDate: string | null;
  deadlineDate: string | null;
  checklist: ChecklistItem[];
  resources: Resource[];
  notes: string;
  history: HistoryEntry[];
  updatedAt: string;
  updatedAtRaw: string;
  createdAt: string;
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
