import { useState, useEffect, useRef } from 'react';
import {
  X, CheckSquare, Square, Link2, Calendar, Tag, StickyNote,
  ExternalLink, PlayCircle, FileText, BookOpen, BookMarked,
  Github, Plus, History, ArrowRightLeft, TrendingUp, Edit3,
  ChevronDown, Trash2,
} from 'lucide-react';
import {
  statusConfig, boardColorMap, topicTypeConfig, difficultyConfig,
  resourceTypeConfig, historyActionConfig,
} from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import type { Status, TopicType, Difficulty, Resource, HistoryEntry, Topic, Board } from '../types';

interface TopicDrawerProps {
  topic: Topic | null;
  boards: Board[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<{
    title: string; description: string; status: Status; type: TopicType;
    difficulty: Difficulty; progress: number; tags: string[];
    reviewDate: string | null; checklist: Topic['checklist'];
    resources: Resource[]; notes: string; history: HistoryEntry[];
  }>) => Promise<void>;
  onAddChecklistItem: (topicId: string, text: string) => Promise<void>;
  onDeleteChecklistItem: (topicId: string, itemId: string) => Promise<void>;
  onAddResource: (topicId: string, data: { title: string; type: Resource['type']; url: string }) => Promise<void>;
  onDeleteResource: (topicId: string, resourceId: string) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
}

const resourceIcons: Record<string, typeof PlayCircle> = {
  Link2, BookOpen, PlayCircle, BookMarked, Github,
};

const historyIcons: Record<string, typeof Plus> = {
  Plus, Edit3, ArrowRightLeft, TrendingUp,
};

export default function TopicDrawer({
  topic, boards, onClose, onUpdate,
  onAddChecklistItem, onDeleteChecklistItem,
  onAddResource, onDeleteResource,
  onDeleteTopic,
}: TopicDrawerProps) {
  // Local state only for fields that need controlled input before saving:
  // - notes: saved on blur to avoid per-keystroke writes
  // - newTag input: pure UI, not persisted until submitted
  // All other fields (status, type, difficulty, etc.) read directly from topic prop
  // and write through immediately on change — no local mirror needed.
  const [notes, setNotes] = useState(topic?.notes ?? '');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newResource, setNewResource] = useState({ title: '', type: 'url' as Resource['type'], url: '' });
  const [newTag, setNewTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync notes when a different topic is opened
  const prevTopicId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (topic?.id !== prevTopicId.current) {
      setNotes(topic?.notes ?? '');
      setNewChecklistText('');
      setNewResource({ title: '', type: 'url', url: '' });
      setNewTag('');
      prevTopicId.current = topic?.id;
    }
  }, [topic?.id, topic?.notes]);

  if (!topic) return null;

  const board = boards.find((b) => b.id === topic.boardId);
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;
  const statusStyle = statusConfig[topic.status];
  const checklistDone = topic.checklist.filter((item) => item.done).length;
  const checklistPct = topic.checklist.length > 0
    ? Math.round((checklistDone / topic.checklist.length) * 100)
    : 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleCheck = (id: string) => {
    const updated = topic.checklist.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    onUpdate(topic.id, { checklist: updated });
  };

  const handleToggleResource = (id: string) => {
    const updated = topic.resources.map((r) => r.id === id ? { ...r, done: !r.done } : r);
    onUpdate(topic.id, { resources: updated });
  };

  const handleAddChecklist = async () => {
    if (!newChecklistText.trim()) return;
    await onAddChecklistItem(topic.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddResource = async () => {
    if (!newResource.title.trim()) return;
    await onAddResource(topic.id, newResource);
    setNewResource({ title: '', type: 'url', url: '' });
  };

  const handleStatusChange = (newStatus: Status) => {
    const newProgress = newStatus === 'completed' ? 100 : newStatus === 'to_learn' ? 0 : topic.progress;
    const newHistory: HistoryEntry[] = [
      ...topic.history,
      {
        id: `h_${crypto.randomUUID()}`,
        action: 'moved',
        detail: `${statusConfig[topic.status].label} → ${statusConfig[newStatus].label}`,
        date: new Date().toISOString(),
      },
    ];
    onUpdate(topic.id, { status: newStatus, progress: newProgress, history: newHistory });
  };

  const handleProgressChange = (value: number) => {
    onUpdate(topic.id, { progress: value });
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || topic.tags.includes(tag)) return;
    onUpdate(topic.id, { tags: [...topic.tags, tag] });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    onUpdate(topic.id, { tags: topic.tags.filter((t) => t !== tag) });
  };

  const handleNotesBlur = () => {
    if (notes !== topic.notes) {
      onUpdate(topic.id, { notes });
    }
  };

  const handleReviewDateChange = (value: string) => {
    onUpdate(topic.id, { reviewDate: value || null });
  };

  const handleConfirmDelete = async () => {
    await onDeleteTopic(topic.id);
    onClose();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="overlay fixed inset-0 z-40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg animate-slide-in-right flex-col border-l border-white/[0.08] bg-ink-950 shadow-2xl">
        {/* Header */}
        <div className={`relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b ${boardColors.gradient} px-6 pb-5 pt-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`chip ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>
              <span className={`chip ${boardColors.bg} ${boardColors.text} border ${boardColors.border}`}>
                {board?.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                title="Delete topic"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h2 className="mt-4 text-xl font-bold leading-tight tracking-tight text-always-white text-balance">
            {topic.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
            {topic.description || 'No description yet'}
          </p>

          {/* Status selector */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {(['to_learn', 'learning', 'practice', 'review', 'completed'] as Status[]).map((st) => {
              const cfg = statusConfig[st];
              const active = topic.status === st;
              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`chip border transition-all ${
                    active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-white/[0.06] text-ink-600 hover:text-ink-400'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

          {/* Properties */}
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Properties</h3>
            <div className="mt-3 space-y-3">

              {/* Type */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink-500">Type</span>
                <div className="relative flex-1">
                  <select
                    value={topic.type}
                    onChange={(e) => onUpdate(topic.id, { type: e.target.value as TopicType })}
                    className="w-full appearance-none rounded-lg border border-white/[0.06] bg-ink-800 py-2 pl-3 pr-8 text-sm text-ink-100 transition-colors focus:border-sky-500/30 focus:outline-none"
                  >
                    {Object.entries(topicTypeConfig).map(([key, cfg]) => (
                      <option key={key} value={key} className="bg-ink-700">{cfg.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink-500">Difficulty</span>
                <div className="flex flex-1 gap-1.5">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                    const cfg = difficultyConfig[d];
                    const active = topic.difficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => onUpdate(topic.id, { difficulty: d })}
                        className={`chip border transition-all ${
                          active ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'border-white/[0.06] text-ink-600 hover:text-ink-400'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink-500">Progress</span>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                      <div
                        className={`h-full rounded-full ${statusStyle.dot} transition-all duration-300`}
                        style={{ width: `${topic.progress}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-sm font-semibold tabular-nums text-white">
                      {topic.progress}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={topic.progress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                </div>
              </div>

              {/* Review date */}
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-ink-500">Review</span>
                <input
                  type="date"
                  value={topic.reviewDate ?? ''}
                  onChange={(e) => handleReviewDateChange(e.target.value)}
                  className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-2 text-sm text-ink-100 transition-colors focus:border-sky-500/30 focus:outline-none [color-scheme:dark]"
                />
              </div>

              {/* Tags */}
              <div className="flex items-start gap-3">
                <span className="mt-2 w-20 shrink-0 text-xs text-ink-500">Tags</span>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`chip ${boardColors.bg} ${boardColors.text} border ${boardColors.border} group`}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                          title={`Remove "${tag}"`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Add tag…"
                      className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                      className="rounded-lg bg-ink-700 p-1.5 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="my-6 border-t border-white/[0.04]" />

          {/* Checklist */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckSquare className="h-4 w-4 text-ink-500" /> Checklist
              <span className="text-xs font-normal text-ink-600">({checklistDone}/{topic.checklist.length})</span>
            </h3>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
              <div
                className={`h-full rounded-full ${statusStyle.dot} transition-all duration-500`}
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <div className="mt-3 space-y-1">
              {topic.checklist.map((item) => (
                <div
                  key={item.id}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]"
                >
                  <button onClick={() => handleToggleCheck(item.id)} className="shrink-0">
                    {item.done
                      ? <CheckSquare className="h-4 w-4 text-emerald-400" />
                      : <Square className="h-4 w-4 text-ink-700 transition-colors group-hover:text-ink-500" />
                    }
                  </button>
                  <span className={`flex-1 text-sm ${item.done ? 'text-ink-600 line-through' : 'text-ink-100'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => onDeleteChecklistItem(topic.id, item.id)}
                    className="rounded p-1 text-ink-700 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-400 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddChecklist(); }}
                placeholder="Add checklist item…"
                className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/30 focus:outline-none"
              />
              <button
                onClick={handleAddChecklist}
                disabled={!newChecklistText.trim()}
                className="rounded-lg bg-ink-700 p-2 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </section>

          <div className="my-6 border-t border-white/[0.04]" />

          {/* Resources */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Link2 className="h-4 w-4 text-ink-500" /> Resources
              <span className="text-xs font-normal text-ink-600">({topic.resources.length})</span>
            </h3>
            <div className="mt-3 space-y-2">
              {topic.resources.map((r: Resource) => {
                const rc = resourceTypeConfig[r.type];
                const Icon = resourceIcons[rc.icon] ?? FileText;
                return (
                  <div
                    key={r.id}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-ink-800 p-3 transition-colors hover:border-white/[0.08]"
                  >
                    <button onClick={() => handleToggleResource(r.id)} className="shrink-0">
                      {r.done
                        ? <CheckSquare className="h-4 w-4 text-emerald-400" />
                        : <Square className="h-4 w-4 text-ink-700 transition-colors hover:text-ink-500" />
                      }
                    </button>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-700">
                      <Icon className="h-4 w-4 text-ink-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-medium ${r.done ? 'text-ink-600 line-through' : 'text-ink-100'}`}>
                        {r.title}
                      </div>
                      <div className="text-xs text-ink-600">{rc.label}</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {r.url && r.url !== '#' && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => onDeleteResource(topic.id, r.id)}
                        className="rounded-md p-1.5 text-ink-700 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                        title="Remove resource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {topic.resources.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center">
                  <p className="text-xs text-ink-600">No resources linked yet</p>
                </div>
              )}
            </div>
            <div className="mt-3 space-y-2 rounded-xl border border-white/[0.05] bg-ink-800/60 p-3">
              <input
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder="Resource title…"
                className="w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value as Resource['type'] })}
                  className="appearance-none rounded-lg border border-white/[0.06] bg-ink-900 px-2.5 py-2 text-xs text-ink-100 focus:border-sky-500/30 focus:outline-none"
                >
                  {Object.entries(resourceTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key} className="bg-ink-700">{cfg.label}</option>
                  ))}
                </select>
                <input
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  placeholder="https://…"
                  className="flex-1 rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
                />
                <button
                  onClick={handleAddResource}
                  disabled={!newResource.title.trim()}
                  className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          <div className="my-6 border-t border-white/[0.04]" />

          {/* Notes */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <StickyNote className="h-4 w-4 text-ink-500" /> Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Write your insights, summaries, or questions…"
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/[0.06] bg-ink-800 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-700 transition-colors focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            />
          </section>

          <div className="my-6 border-t border-white/[0.04]" />

          {/* History */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <History className="h-4 w-4 text-ink-500" /> History
            </h3>
            <div className="mt-3 space-y-0">
              {topic.history.map((h: HistoryEntry, i) => {
                const hcfg = historyActionConfig[h.action];
                const Icon = historyIcons[hcfg.icon] ?? Plus;
                const isLast = i === topic.history.length - 1;
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 ring-1 ring-white/[0.05]">
                        <Icon className={`h-3.5 w-3.5 ${hcfg.color}`} />
                      </div>
                      {!isLast && <div className="my-0.5 h-full w-px bg-white/[0.06]" />}
                    </div>
                    <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
                      <div className="text-sm font-medium text-ink-100">{hcfg.label}</div>
                      <div className="mt-0.5 text-xs text-ink-600">{h.detail}</div>
                      <div className="mt-0.5 font-mono text-xs text-ink-700">
                        {/* Show ISO date if stored, otherwise raw value */}
                        {h.date.includes('T') ? new Date(h.date).toLocaleString() : h.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer meta */}
          <div className="my-6 border-t border-white/[0.04]" />
          <div className="flex items-center gap-4 text-xs text-ink-600">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created {topic.createdAt}</span>
            <span>Updated {topic.updatedAt}</span>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete topic?"
          message={`"${topic.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
