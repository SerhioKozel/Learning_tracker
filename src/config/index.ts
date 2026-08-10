import { Layout, Network, Binary, Server, Cloud } from 'lucide-react';
import type { Status, Difficulty, TopicType, Resource, HistoryEntry } from '../types';

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

export const boardColorMap: Record<string, {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  ring: string;
}> = {
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-300',     border: 'border-sky-500/30',     gradient: 'from-sky-500/20 to-sky-500/0',     ring: 'ring-sky-500/30' },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-300',    border: 'border-teal-500/30',    gradient: 'from-teal-500/20 to-teal-500/0',    ring: 'ring-teal-500/30' },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   gradient: 'from-amber-500/20 to-amber-500/0',   ring: 'ring-amber-500/30' },
  rose:    { bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/30',    gradient: 'from-rose-500/20 to-rose-500/0',    ring: 'ring-rose-500/30' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-500/0', ring: 'ring-emerald-500/30' },
};

export const BOARD_COLOR_OPTIONS: { value: 'sky' | 'teal' | 'amber' | 'rose' | 'emerald'; label: string; preview: string }[] = [
  { value: 'sky',     label: 'Sky',     preview: 'bg-sky-500' },
  { value: 'teal',    label: 'Teal',    preview: 'bg-teal-500' },
  { value: 'amber',   label: 'Amber',   preview: 'bg-amber-500' },
  { value: 'rose',    label: 'Rose',    preview: 'bg-rose-500' },
  { value: 'emerald', label: 'Emerald', preview: 'bg-emerald-500' },
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
  completed: { label: 'Completed',  color: 'emerald', bg: 'bg-emerald-500/15',  text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
};

export const STATUS_ORDER: Status[] = ['to_learn', 'learning', 'practice', 'review', 'completed'];

// ─── Topic types ─────────────────────────────────────────────────────────────

export const topicTypeConfig: Record<TopicType, { icon: string; label: string; emoji: string }> = {
  learning:      { icon: 'BookOpen',      label: 'Learning',      emoji: '📘' },
  book:          { icon: 'BookOpen',      label: 'Book',          emoji: '📖' },
  video:         { icon: 'PlayCircle',    label: 'Video',         emoji: '🎥' },
  course:        { icon: 'GraduationCap', label: 'Course',        emoji: '🎓' },
  documentation: { icon: 'BookMarked',    label: 'Docs',          emoji: '📄' },
  repository:    { icon: 'Github',        label: 'Repo',          emoji: '📦' },
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
  github:        { icon: 'Github',    label: 'Repo' },
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
