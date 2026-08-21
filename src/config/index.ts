import { Layout, Network, Binary, Server, Cloud } from 'lucide-react';
import type { Status, Difficulty, TopicType, Resource, HistoryEntry, BoardColor } from '../types';

// ─── Board icons ────────────────────────────────────────────────────────────
// Single source of truth — previously duplicated in BoardView, BoardsList, Dashboard.

export const BOARD_ICONS: Record<string, typeof Layout> = {
  Layout,
  Network,
  Binary,
  Server,
  Cloud,
};

export const BOARD_ICON_NAMES = Object.keys(BOARD_ICONS) as string[];

// ─── Board colors ────────────────────────────────────────────────────────────

export const boardColorMap: Record<BoardColor, {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  ring: string;
  dot: string;
}> = {
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-300',     border: 'border-sky-500/30',     gradient: 'from-sky-500/20 to-sky-500/0',     ring: 'ring-sky-500/30',     dot: 'bg-sky-400' },
  cyan:    { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    border: 'border-cyan-500/30',    gradient: 'from-cyan-500/20 to-cyan-500/0',    ring: 'ring-cyan-500/30',    dot: 'bg-cyan-400' },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-300',    border: 'border-teal-500/30',    gradient: 'from-teal-500/20 to-teal-500/0',    ring: 'ring-teal-500/30',    dot: 'bg-teal-400' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-500/0', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   gradient: 'from-amber-500/20 to-amber-500/0',   ring: 'ring-amber-500/30',   dot: 'bg-amber-400' },
  orange:  { bg: 'bg-orange-500/15',  text: 'text-orange-300',  border: 'border-orange-500/30',  gradient: 'from-orange-500/20 to-orange-500/0',  ring: 'ring-orange-500/30',  dot: 'bg-orange-400' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/30',    gradient: 'from-rose-500/20 to-rose-500/0',    ring: 'ring-rose-500/30',    dot: 'bg-rose-400' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/30',  gradient: 'from-violet-500/20 to-violet-500/0',  ring: 'ring-violet-500/30',  dot: 'bg-violet-400' },
  indigo:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-300',  border: 'border-indigo-500/30',  gradient: 'from-indigo-500/20 to-indigo-500/0',  ring: 'ring-indigo-500/30',  dot: 'bg-indigo-400' },
};

export const BOARD_COLOR_OPTIONS: { value: BoardColor; label: string; preview: string }[] = [
  { value: 'sky',     label: 'Sky',     preview: 'bg-sky-500' },
  { value: 'cyan',    label: 'Cyan',    preview: 'bg-cyan-500' },
  { value: 'teal',    label: 'Teal',    preview: 'bg-teal-500' },
  { value: 'emerald', label: 'Emerald', preview: 'bg-emerald-500' },
  { value: 'amber',   label: 'Amber',   preview: 'bg-amber-500' },
  { value: 'orange',  label: 'Orange',  preview: 'bg-orange-500' },
  { value: 'rose',    label: 'Rose',    preview: 'bg-rose-500' },
  { value: 'violet',  label: 'Violet',  preview: 'bg-violet-500' },
  { value: 'indigo',  label: 'Indigo',  preview: 'bg-indigo-500' },
];

// ─── Status ──────────────────────────────────────────────────────────────────

export const statusConfig: Record<Status, {
  label: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  to_learn:  { label: 'To Learn',   color: 'ink',     bg: 'bg-ink-700/40',      text: 'text-ink-300',     border: 'border-ink-600/40',     dot: 'bg-ink-400' },
  learning:  { label: 'Learning',   color: 'teal',    bg: 'bg-teal-500/15',     text: 'text-teal-300',    border: 'border-teal-500/30',    dot: 'bg-teal-400' },
  practice:  { label: 'Practice',   color: 'sky',     bg: 'bg-sky-500/15',      text: 'text-sky-300',     border: 'border-sky-500/30',     dot: 'bg-sky-400' },
  review:    { label: 'Review',     color: 'amber',   bg: 'bg-amber-500/15',    text: 'text-amber-300',   border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  completed: { label: 'Mastered',  color: 'emerald', bg: 'bg-emerald-500/15',  text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
};

export const STATUS_ORDER: Status[] = ['to_learn', 'learning', 'practice', 'review', 'completed'];

/** Statuses shown in the UI (kanban columns, drawer pills, charts). review is hidden. */
export const VISIBLE_STATUS_ORDER: Status[] = ['to_learn', 'learning', 'practice', 'completed'];

// ─── Topic types ─────────────────────────────────────────────────────────────

export const topicTypeConfig: Record<TopicType, { icon: string; label: string; emoji: string }> = {
  learning:      { icon: 'BookOpen',      label: 'Learning',      emoji: '📘' },
  book:          { icon: 'BookOpen',      label: 'Book',          emoji: '📖' },
  video:         { icon: 'PlayCircle',    label: 'Video',         emoji: '🎥' },
  course:        { icon: 'GraduationCap', label: 'Course',        emoji: '🎓' },
  documentation: { icon: 'BookMarked',    label: 'Docs',          emoji: '📄' },
  repository:    { icon: 'Code2',         label: 'Repo',          emoji: '📦' },
  interview:     { icon: 'MessageSquare', label: 'Interview',     emoji: '💬' },
  certification: { icon: 'Award',         label: 'Cert',          emoji: '🏆' },
  project:       { icon: 'FolderGit2',    label: 'Project',       emoji: '🔧' },
  custom:        { icon: 'Star',          label: 'Custom',        emoji: '⭐' },
};

// ─── Difficulty ───────────────────────────────────────────────────────────────

export const difficultyConfig: Record<Difficulty, { label: string; bg: string; text: string; border: string }> = {
  easy:   { label: 'Easy',   bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  medium: { label: 'Medium', bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30' },
  hard:   { label: 'Hard',   bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/30' },
};

// ─── Resource types ───────────────────────────────────────────────────────────

export const resourceTypeConfig: Record<Resource['type'], { icon: string; label: string }> = {
  url:           { icon: 'Link2',     label: 'URL' },
  book:          { icon: 'BookOpen',  label: 'Book' },
  video:         { icon: 'PlayCircle',label: 'Video' },
  documentation: { icon: 'BookMarked',label: 'Docs' },
  github:        { icon: 'Code2',     label: 'Repo' },
};

// ─── History actions ──────────────────────────────────────────────────────────

export const historyActionConfig: Record<HistoryEntry['action'], { label: string; icon: string; color: string }> = {
  created:  { label: 'Created',  icon: 'Plus',           color: 'text-sky-400' },
  updated:  { label: 'Updated',  icon: 'Edit3',          color: 'text-ink-400' },
  moved:    { label: 'Moved',    icon: 'ArrowRightLeft', color: 'text-teal-400' },
  progress: { label: 'Progress', icon: 'TrendingUp',     color: 'text-emerald-400' },
};

// ─── Heatmap ──────────────────────────────────────────────────────────────────
// Single source of truth — previously duplicated in Dashboard and Statistics.

export const HEATMAP_COLORS = [
  'bg-ink-700/60',
  'bg-sky-500/30',
  'bg-sky-500/50',
  'bg-sky-500/70',
  'bg-sky-400',
] as const;
