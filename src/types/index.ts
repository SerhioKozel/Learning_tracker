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
  progress: number;
  tags: string[];
  reviewDate: string | null;
  checklist: ChecklistItem[];
  resources: Resource[];
  notes: string;
  history: HistoryEntry[];
  updatedAt: string;
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  color: 'sky' | 'teal' | 'amber' | 'rose' | 'emerald';
  icon: string;
  topicCount: number;
  completedCount: number;
  updatedAt: string;
  updatedAtRaw: string;
  createdAt: string;
}

export interface CalendarEvent {
  date: string;
  type: 'review' | 'deadline' | 'completed';
  topicId: string;
  title: string;
}
