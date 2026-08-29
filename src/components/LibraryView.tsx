import { useState, useMemo } from 'react';
import { Library, Plus, Search, Tag as TagIcon, X, FolderPlus } from 'lucide-react';
import { useLibraryStore } from '../hooks/useLibraryStore';
import { useDataStore } from '../hooks/useDataStore';
import { difficultyConfig, BOARD_COLOR_OPTIONS } from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import type { LibraryTopic, BoardColor } from '../types';

interface LibraryViewProps {
  store: ReturnType<typeof useDataStore>;
}

export default function LibraryView({ store }: LibraryViewProps) {
  const library = useLibraryStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addModalTopic, setAddModalTopic] = useState<LibraryTopic | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(library.libraryTopics.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [library.libraryTopics]);

  const filtered = useMemo(() => {
    return library.libraryTopics.filter((t) => {
      if (activeCategory && t.category !== activeCategory) return false;
      if (query) {
        const q = query.toLowerCase();
        const matches = t.title.toLowerCase().includes(q)
          || t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [library.libraryTopics, activeCategory, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, LibraryTopic[]>();
    for (const t of filtered) {
      const key = t.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleAddClick = (topic: LibraryTopic) => {
    setAddModalTopic(topic);
  };

  const handleAdded = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  if (library.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="animate-fade-up flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
          <Library className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Library</h1>
          <p className="text-sm text-ink-500">Browse curated topics and add them to your boards.</p>
        </div>
      </div>

      {/* Search + category filter */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics or tags…"
            className="w-full rounded-lg border border-white/[0.08] bg-ink-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`chip cursor-pointer border ${activeCategory === null
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-ink-700/40 text-ink-400 border-ink-600/40 hover:text-ink-200'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c === activeCategory ? null : c)}
              className={`chip cursor-pointer border ${activeCategory === c
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                : 'bg-ink-700/40 text-ink-400 border-ink-600/40 hover:text-ink-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Library className="h-8 w-8 text-ink-600" />
          <p className="text-sm text-ink-500">
            {library.libraryTopics.length === 0
              ? 'The library is empty. Ask an admin to add topics.'
              : 'No topics match your search.'}
          </p>
        </div>
      )}

      {/* Grouped list */}
      <div className="mt-6 space-y-8">
        {grouped.map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-white">{category}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((topic) => {
                const diff = difficultyConfig[topic.difficulty];
                const existing = store.findExistingCopy(topic.id);
                return (
                  <div
                    key={topic.id}
                    className="surface flex flex-col gap-3 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-white">{topic.title}</h3>
                      <span className={`chip shrink-0 border text-[10px] ${diff.bg} ${diff.text} ${diff.border}`}>
                        {diff.label}
                      </span>
                    </div>
                    {topic.description && (
                      <p className="line-clamp-2 text-xs text-ink-500">{topic.description}</p>
                    )}
                    {topic.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {topic.tags.map((tag) => (
                          <span key={tag} className="chip bg-ink-700/40 text-ink-400 border border-ink-600/40 text-[10px]">
                            <TagIcon className="h-2.5 w-2.5" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => handleAddClick(topic)}
                      className="btn-soft mt-auto flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Board
                    </button>
                    {existing && (
                      <p className="text-[10px] text-ink-600">
                        Already on your board — this topic can still be added again to a different board.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {addModalTopic && (
        <AddToBoardModal
          topic={addModalTopic}
          store={store}
          onClose={() => setAddModalTopic(null)}
          onAdded={handleAdded}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-lg bg-ink-800 border border-white/[0.08] px-4 py-2.5 text-sm text-white shadow-lift animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Add to Board modal ─────────────────────────────────────────────────────

function AddToBoardModal({
  topic,
  store,
  onClose,
  onAdded,
}: {
  topic: LibraryTopic;
  store: ReturnType<typeof useDataStore>;
  onClose: () => void;
  onAdded: (message: string) => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>(store.boards.length > 0 ? 'existing' : 'new');
  const [selectedBoardId, setSelectedBoardId] = useState<string>(store.boards[0]?.id ?? '');
  const [newBoardTitle, setNewBoardTitle] = useState(topic.category || '');
  const [newBoardColor, setNewBoardColor] = useState<BoardColor>('sky');
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existing = store.findExistingCopy(topic.id);

  const performAdd = async (boardId: string) => {
    setSubmitting(true);
    const result = await store.addTopicFromLibrary(topic, boardId);
    setSubmitting(false);
    if (result) {
      onAdded(`"${topic.title}" added to your board.`);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (mode === 'existing') {
      if (!selectedBoardId) return;
      if (existing && !confirmDuplicate) {
        setConfirmDuplicate(true);
        return;
      }
      await performAdd(selectedBoardId);
    } else {
      if (!newBoardTitle.trim()) return;
      setSubmitting(true);
      const board = await store.createBoard({
        title: newBoardTitle.trim(),
        description: '',
        color: newBoardColor,
        icon: 'Layout',
      });
      setSubmitting(false);
      if (board) {
        if (existing && !confirmDuplicate) {
          setConfirmDuplicate(true);
          // Board is already created at this point — proceed anyway on next confirm
          setSelectedBoardId(board.id);
          setMode('existing');
          return;
        }
        await performAdd(board.id);
      }
    }
  };

  if (confirmDuplicate) {
    return (
      <ConfirmDialog
        title="Already added"
        message={`You already have a copy of "${topic.title}" on one of your boards. Add another copy anyway?`}
        confirmLabel="Add anyway"
        onConfirm={() => { setConfirmDuplicate(false); performAdd(selectedBoardId); }}
        onCancel={() => setConfirmDuplicate(false)}
      />
    );
  }

  return (
    <div className="overlay fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-ink-800 p-6 shadow-lift animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Add "{topic.title}"</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-500 hover:bg-white/[0.06] hover:text-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode('existing')}
            disabled={store.boards.length === 0}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
              mode === 'existing' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-white/[0.08] text-ink-400 hover:text-ink-200'
            }`}
          >
            Existing board
          </button>
          <button
            onClick={() => setMode('new')}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'new' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-white/[0.08] text-ink-400 hover:text-ink-200'
            }`}
          >
            <FolderPlus className="h-3.5 w-3.5" /> New board
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="mt-4 space-y-1.5">
            {store.boards.length === 0 ? (
              <p className="text-xs text-ink-500">You don't have any boards yet — create one instead.</p>
            ) : (
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none focus:border-sky-500/40"
              >
                {store.boards.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Board title"
              className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
            />
            <div className="flex flex-wrap gap-2">
              {BOARD_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewBoardColor(opt.value)}
                  className={`h-7 w-7 rounded-full ${opt.preview} ${newBoardColor === opt.value ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-ink-800' : ''}`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-soft">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (mode === 'existing' ? !selectedBoardId : !newBoardTitle.trim())}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? 'Adding…' : 'Add topic'}
          </button>
        </div>
      </div>
    </div>
  );
}
