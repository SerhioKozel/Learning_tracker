// AdminLibraryView — dedicated screen for Knowledge Library CRUD.
// Reached via the "Knowledge Library" tile in AdminView (/admin).
// AdminRoute already guarantees only admins reach this component.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Library, Plus, Pencil, Trash2, X, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useLibraryStore } from '../hooks/useLibraryStore';
import { difficultyConfig } from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import type { LibraryTopic, Difficulty } from '../types';

type SortField = 'title' | 'category' | 'difficulty' | 'tags';
type SortDirection = 'asc' | 'desc';

const DIFFICULTY_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

export default function AdminLibraryView() {
  const navigate = useNavigate();
  const library = useLibraryStore();
  const [editing, setEditing] = useState<LibraryTopic | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryTopic | null>(null);
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await library.deleteLibraryTopic(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return library.libraryTopics;
    const q = query.toLowerCase();
    return library.libraryTopics.filter((t) =>
      t.title.toLowerCase().includes(q)
      || t.category.toLowerCase().includes(q)
      || t.difficulty.toLowerCase().includes(q)
      || t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [library.libraryTopics, query]);

  const sorted = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'title':
          return a.title.localeCompare(b.title) * dir;
        case 'category':
          return a.category.localeCompare(b.category) * dir;
        case 'difficulty':
          return (DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]) * dir;
        case 'tags':
          return (a.tags.join(',').localeCompare(b.tags.join(','))) * dir;
        default:
          return 0;
      }
    });
  }, [filtered, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-ink-600" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 text-sky-400" />
      : <ArrowDown className="h-3 w-3 text-sky-400" />;
  };

  const columnHeader = (field: SortField, label: string) => (
    <th className="px-4 py-2.5 font-medium">
      <button
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1.5 transition-colors hover:text-ink-200"
      >
        {label} <SortIcon field={field} />
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="animate-fade-up">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1.5 text-xs text-ink-500 transition-colors hover:text-ink-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Admin panel
      </button>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Library className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Library</h1>
            <p className="text-sm text-ink-500">{library.libraryTopics.length} topics</p>
          </div>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="h-4 w-4" /> New topic
        </button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, category, difficulty, tags…"
          className="w-full rounded-lg border border-white/[0.08] bg-ink-800 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
        />
      </div>

      {library.error && (
        <p className="mt-3 text-xs text-rose-400">{library.error}</p>
      )}

      {library.loading ? (
        <div className="mt-10 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-700 border-t-sky-400" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">
          {library.libraryTopics.length === 0 ? 'No library topics yet. Create the first one.' : 'No topics match your search.'}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-ink-800/60 text-xs text-ink-500">
                {columnHeader('title', 'Title')}
                {columnHeader('category', 'Category')}
                {columnHeader('difficulty', 'Difficulty')}
                {columnHeader('tags', 'Tags')}
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const diff = difficultyConfig[t.difficulty];
                return (
                  <tr key={t.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-ink-200">{t.title}</td>
                    <td className="px-4 py-2.5 text-ink-500">{t.category || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`chip border text-[10px] ${diff.bg} ${diff.text} ${diff.border}`}>{diff.label}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-500">
                      {t.tags.length > 0 ? t.tags.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(t)}
                          className="rounded-md p-1.5 text-ink-500 hover:bg-white/[0.06] hover:text-ink-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="rounded-md p-1.5 text-ink-500 hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {editing && (
        <LibraryTopicForm
          topic={editing === 'new' ? null : editing}
          onSave={async (data) => {
            if (editing === 'new') {
              await library.createLibraryTopic(data);
            } else {
              await library.updateLibraryTopic(editing.id, data);
            }
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete library topic?"
          message={`"${deleteTarget.title}" will be removed from the library. Topics users already added to their boards are not affected.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Create / edit form ─────────────────────────────────────────────────────

function LibraryTopicForm({
  topic,
  onSave,
  onCancel,
}: {
  topic: LibraryTopic | null;
  onSave: (data: { title: string; description: string; difficulty: Difficulty; category: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(topic?.title ?? '');
  const [description, setDescription] = useState(topic?.description ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>(topic?.difficulty ?? 'medium');
  const [category, setCategory] = useState(topic?.category ?? '');
  const [tagsInput, setTagsInput] = useState(topic?.tags.join(', ') ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    await onSave({ title: title.trim(), description: description.trim(), difficulty, category: category.trim(), tags });
    setSubmitting(false);
  };

  return (
    <div className="overlay fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-ink-800 p-6 shadow-lift animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            {topic ? 'Edit library topic' : 'New library topic'}
          </h3>
          <button onClick={onCancel} className="rounded-md p-1.5 text-ink-500 hover:bg-white/[0.06] hover:text-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full resize-none rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. JavaScript)"
              className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none focus:border-sky-500/40"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags, comma separated"
            className="w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 outline-none focus:border-sky-500/40"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-soft">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
