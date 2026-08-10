import { useState } from 'react';
import {
  Plus, Clock, CheckSquare, Link2, ChevronLeft,
  Search, Trash2, X, Layout,
} from 'lucide-react';
import { statusConfig, boardColorMap, topicTypeConfig, difficultyConfig, BOARD_ICONS } from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import type { Status, Topic, Board } from '../types';

interface BoardViewProps {
  boardId: string | null;
  boards: Board[];
  topics: Topic[];
  onSelectTopic: (id: string) => void;
  onBack: () => void;
  onCreateTopic: (data: { title: string; boardId: string; status?: Status }) => Promise<Topic | null>;
  onDeleteTopic: (id: string) => Promise<void>;
}

const COLUMN_ORDER: Status[] = ['to_learn', 'learning', 'practice', 'review', 'completed'];

function TopicCard({
  topic,
  onClick,
  onDelete,
}: {
  topic: Topic;
  onClick: () => void;
  onDelete: () => void;
}) {
  const s = statusConfig[topic.status];
  const tc = topicTypeConfig[topic.type];
  const d = difficultyConfig[topic.difficulty];
  const checklistDone = topic.checklist.filter((c) => c.done).length;
  const checklistTotal = topic.checklist.length;

  return (
    <div className="group relative w-full rounded-xl border border-white/[0.06] bg-ink-800 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-lift">
      <button onClick={onClick} className="block w-full text-left">
        <div className="mb-2 flex items-center justify-between">
          <span className="chip border border-ink-600/40 bg-ink-700/40 text-[10px] text-ink-300">
            {tc.label}
          </span>
          <span className={`chip border text-[10px] ${d.bg} ${d.text} ${d.border}`}>
            {d.label}
          </span>
        </div>

        <h4 className="text-sm font-semibold leading-snug text-ink-100 group-hover:text-white">
          {topic.title}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-ink-500 line-clamp-2">
          {topic.description || 'No description yet'}
        </p>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-ink-600">
            <span>Progress</span>
            <span className="tabular-nums">{topic.progress}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-700">
            <div
              className={`h-full rounded-full ${s.dot} transition-all duration-500`}
              style={{ width: `${topic.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
          <div className="flex items-center gap-3">
            {checklistTotal > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-ink-600">
                <CheckSquare className="h-3 w-3" /> {checklistDone}/{checklistTotal}
              </span>
            )}
            {topic.resources.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-ink-600">
                <Link2 className="h-3 w-3" /> {topic.resources.length}
              </span>
            )}
            {topic.reviewDate && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400/70">
                <Clock className="h-3 w-3" /> {topic.reviewDate.slice(5)}
              </span>
            )}
          </div>
          {topic.tags.length > 0 && (
            <span className="text-[10px] text-ink-600">{topic.tags[0]}</span>
          )}
        </div>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute right-2 top-2 rounded-md p-1 text-ink-700 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 group-hover:opacity-100"
        title="Delete topic"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function BoardView({
  boardId, boards, topics, onSelectTopic, onBack, onCreateTopic, onDeleteTopic,
}: BoardViewProps) {
  const [query, setQuery] = useState('');
  const [newTopicCol, setNewTopicCol] = useState<Status | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  if (!board) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">No board selected</h1>
        <button onClick={onBack} className="btn-primary mt-4">Go to boards</button>
      </div>
    );
  }

  const c = boardColorMap[board.color] ?? boardColorMap.sky;
  const Icon = BOARD_ICONS[board.icon] ?? Layout;
  const boardTopics = topics.filter((t) => t.boardId === board.id);
  const filteredTopics = boardTopics.filter(
    (t) => !query
      || t.title.toLowerCase().includes(query.toLowerCase())
      || t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
  );
  const pct = board.topicCount > 0 ? Math.round((board.completedCount / board.topicCount) * 100) : 0;
  const topicToDelete = topics.find((t) => t.id === confirmDeleteId);

  const handleCreateInCol = async () => {
    if (!newTopicTitle.trim() || !newTopicCol) return;
    await onCreateTopic({ title: newTopicTitle.trim(), boardId: board.id, status: newTopicCol });
    setNewTopicTitle('');
    setNewTopicCol(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await onDeleteTopic(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Board header */}
      <div className={`relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b ${c.gradient} px-8 py-6`}>
        <div className="relative flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className="mb-3 flex items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> All boards
            </button>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-always-white">{board.title}</h1>
                <p className="mt-0.5 text-sm text-ink-500">{board.description}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics…"
              className="w-48 rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-8 pr-3 text-xs text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
            />
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">Progress</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-700">
              <div className={`h-full rounded-full ${c.text.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-always-white">{pct}%</span>
          </div>
          <span className="text-xs text-ink-500">
            {board.topicCount} topics · {board.completedCount} completed · updated {board.updatedAt}
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="min-h-0 flex-1 overflow-x-auto px-8 py-6">
        <div className="flex h-full gap-4">
          {COLUMN_ORDER.map((status) => {
            const s = statusConfig[status];
            const colTopics = filteredTopics.filter((t) => t.status === status);
            return (
              <div key={status} className="flex w-72 shrink-0 flex-col">
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="text-sm font-semibold text-ink-100">{s.label}</span>
                    <span className="rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] tabular-nums text-ink-500">
                      {colTopics.length}
                    </span>
                  </div>
                  <button
                    onClick={() => { setNewTopicCol(status); setNewTopicTitle(''); }}
                    className="rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Cards */}
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-4">
                  {colTopics.map((t) => (
                    <TopicCard
                      key={t.id}
                      topic={t}
                      onClick={() => onSelectTopic(t.id)}
                      onDelete={() => setConfirmDeleteId(t.id)}
                    />
                  ))}

                  {colTopics.length === 0 && newTopicCol !== status && (
                    <div className="rounded-xl border border-dashed border-white/[0.06] p-6 text-center">
                      <p className="text-xs text-ink-600">No topics here yet</p>
                    </div>
                  )}

                  {newTopicCol === status && (
                    <div className="animate-scale-in rounded-xl border border-sky-500/30 bg-sky-500/5 p-2.5">
                      <textarea
                        autoFocus
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateInCol(); }
                          if (e.key === 'Escape') { setNewTopicCol(null); setNewTopicTitle(''); }
                        }}
                        placeholder="Topic title…"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-white/[0.06] bg-ink-900 px-2.5 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/40 focus:outline-none"
                      />
                      <div className="mt-2 flex justify-end gap-1.5">
                        <button
                          onClick={() => { setNewTopicCol(null); setNewTopicTitle(''); }}
                          className="rounded-md p-1 text-ink-600 hover:text-ink-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleCreateInCol}
                          disabled={!newTopicTitle.trim()}
                          className="rounded-md bg-sky-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {newTopicCol !== status && (
                    <button
                      onClick={() => { setNewTopicCol(status); setNewTopicTitle(''); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.06] py-2.5 text-xs text-ink-600 transition-colors hover:border-white/[0.1] hover:text-ink-400"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add topic
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmDeleteId && topicToDelete && (
        <ConfirmDialog
          title="Delete topic?"
          message={`"${topicToDelete.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
