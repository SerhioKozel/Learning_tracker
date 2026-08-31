import { useState } from 'react';
import { X, Copy } from 'lucide-react';
import type { Topic, Board } from '../../types';

interface DuplicateTopicDialogProps {
  topic: Topic;
  boards: Board[];
  onConfirm: (title: string, boardId: string) => Promise<void>;
  onCancel: () => void;
}

export default function DuplicateTopicDialog({
  topic, boards, onConfirm, onCancel,
}: DuplicateTopicDialogProps) {
  const [title, setTitle] = useState(`${topic.title} (copy)`);
  const [boardId, setBoardId] = useState(topic.boardId);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!title.trim()) return;
    setLoading(true);
    await onConfirm(title.trim(), boardId);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div
      className="overlay fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-800 p-6 shadow-lift animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-ink-500" />
            <h3 className="text-base font-semibold text-white">Duplicate topic</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-600">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-white/[0.06] bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            />
          </div>

          {/* Board */}
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-600">
              Board
            </label>
            <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/[0.06] bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id} className="bg-ink-800">
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-soft">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim() || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Duplicating…' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  );
}
