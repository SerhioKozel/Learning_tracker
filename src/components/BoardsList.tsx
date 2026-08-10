import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Layout, MoreVertical, Copy, Trash2, Edit2, X } from 'lucide-react';
import { boardColorMap, BOARD_ICONS, BOARD_ICON_NAMES, BOARD_COLOR_OPTIONS } from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import type { Board, Topic } from '../types';

interface BoardsListProps {
  boards: Board[];
  topics: Topic[];
  onSelectBoard: (id: string) => void;
  onCreateBoard: (data: { title: string; description: string; color: Board['color']; icon: string }) => Promise<Board | null>;
  onUpdateBoard: (id: string, data: Partial<Pick<Board, 'title' | 'description' | 'color' | 'icon'>>) => Promise<void>;
  onDeleteBoard: (id: string) => Promise<void>;
  onDuplicateBoard: (id: string) => Promise<void>;
}

type SortKey = 'updated' | 'name' | 'progress';

export default function BoardsList({
  boards, topics, onSelectBoard,
  onCreateBoard, onUpdateBoard, onDeleteBoard, onDuplicateBoard,
}: BoardsListProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [menuBoard, setMenuBoard] = useState<string | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState<Board['color']>('sky');
  const [formIcon, setFormIcon] = useState('Layout');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuBoard(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const sorted = [...boards]
    .filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'progress') {
        const pa = a.topicCount > 0 ? a.completedCount / a.topicCount : 0;
        const pb = b.topicCount > 0 ? b.completedCount / b.topicCount : 0;
        return pb - pa;
      }
      // Sort by raw timestamp — reliable, no string parsing
      return b.updatedAtRaw.localeCompare(a.updatedAtRaw);
    });

  const openCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormColor('sky');
    setFormIcon('Layout');
    setEditingBoard(null);
    setShowForm(true);
  };

  const openEdit = (board: Board) => {
    setFormTitle(board.title);
    setFormDescription(board.description);
    setFormColor(board.color);
    setFormIcon(board.icon);
    setEditingBoard(board);
    setShowForm(true);
    setMenuBoard(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    if (editingBoard) {
      await onUpdateBoard(editingBoard.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        color: formColor,
        icon: formIcon,
      });
    } else {
      await onCreateBoard({
        title: formTitle.trim(),
        description: formDescription.trim(),
        color: formColor,
        icon: formIcon,
      });
    }
    setShowForm(false);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await onDeleteBoard(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const boardToDelete = boards.find((b) => b.id === confirmDeleteId);

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      {/* Header */}
      <div className="animate-fade-up flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Boards</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {boards.length} learning area{boards.length !== 1 ? 's' : ''} · {topics.length} topic{topics.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> Create board
        </button>
      </div>

      {/* Toolbar */}
      <div className="animate-fade-up animate-delay-100 mt-6 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search boards…"
            className="w-full rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-ink-800/60 p-1">
          {([
            { key: 'updated', label: 'Recent' },
            { key: 'name', label: 'A-Z' },
            { key: 'progress', label: 'Progress' },
          ] as { key: SortKey; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === opt.key ? 'bg-white/[0.08] text-white' : 'text-ink-500 hover:text-ink-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((board, i) => {
          const c = boardColorMap[board.color] ?? boardColorMap.sky;
          const Icon = BOARD_ICONS[board.icon] ?? Layout;
          const pct = board.topicCount > 0 ? Math.round((board.completedCount / board.topicCount) * 100) : 0;
          const boardTopics = topics.filter((t) => t.boardId === board.id);
          const reviewing = boardTopics.filter((t) => t.status === 'review').length;
          return (
            <div
              key={board.id}
              className={`group relative animate-fade-up overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.gradient} p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift`}
              style={{ animationDelay: `${100 + i * 60}ms` }}
            >
              {/* Context menu */}
              <div ref={menuBoard === board.id ? menuRef : undefined} className="absolute right-3 top-3 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuBoard(menuBoard === board.id ? null : board.id); }}
                  className="rounded-lg p-1.5 text-ink-500 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuBoard === board.id && (
                  <div
                    className="absolute right-0 top-full z-20 mt-1 w-40 animate-scale-in rounded-xl border border-white/[0.08] bg-ink-700 p-1 shadow-lift"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => openEdit(board)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-200 transition-colors hover:bg-white/[0.06]">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => { onDuplicateBoard(board.id); setMenuBoard(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-200 transition-colors hover:bg-white/[0.06]">
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(board.id); setMenuBoard(null); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => onSelectBoard(board.id)} className="block w-full text-left">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                  <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{board.title}</h3>
                <p className="mt-1 text-sm text-ink-500 line-clamp-1">{board.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
                  <span><span className="font-semibold tabular-nums text-ink-100">{board.topicCount}</span> topics</span>
                  <span><span className="font-semibold tabular-nums text-ink-100">{board.completedCount}</span> completed</span>
                  {reviewing > 0 && (
                    <span className={c.text}><span className="font-semibold tabular-nums">{reviewing}</span> in review</span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full ${c.text.replace('text-', 'bg-')} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-ink-200">{pct}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs text-ink-600">
                  <span>Updated {board.updatedAt}</span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-700">
            <Search className="h-7 w-7 text-ink-600" />
          </div>
          <p className="mt-4 text-sm text-ink-500">{query ? 'No boards found' : 'No boards yet'}</p>
          {!query && (
            <button onClick={openCreate} className="btn-primary mt-4">
              <Plus className="h-4 w-4" /> Create your first board
            </button>
          )}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="overlay fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm animate-fade-in"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md animate-scale-in rounded-2xl border border-white/[0.08] bg-ink-800 p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingBoard ? 'Edit board' : 'Create board'}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink-500">Title</label>
                <input
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder="e.g. Machine Learning"
                  className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-500">Description</label>
                <input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What is this board about?"
                  className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-500">Color</label>
                <div className="mt-1.5 flex gap-2">
                  {BOARD_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormColor(opt.value)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all ${formColor === opt.value ? 'scale-110 border-white/20' : 'border-transparent'}`}
                    >
                      <span className={`h-5 w-5 rounded-full ${opt.preview}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-500">Icon</label>
                <div className="mt-1.5 flex gap-2">
                  {BOARD_ICON_NAMES.map((name) => {
                    const Icon = BOARD_ICONS[name] ?? Layout;
                    return (
                      <button
                        key={name}
                        onClick={() => setFormIcon(name)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${formIcon === name ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-white/[0.06] text-ink-500 hover:text-ink-100'}`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-soft">Cancel</button>
              <button onClick={handleSubmit} disabled={!formTitle.trim()} className="btn-primary disabled:opacity-40">
                {editingBoard ? 'Save changes' : 'Create board'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && boardToDelete && (
        <ConfirmDialog
          title="Delete board?"
          message={`"${boardToDelete.title}" and all its topics will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
