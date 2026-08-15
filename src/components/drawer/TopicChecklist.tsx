import { CheckSquare, Square, Trash2, Plus } from 'lucide-react';
import { statusConfig } from '../../config';
import type { Topic } from '../../types';

interface TopicChecklistProps {
  topic: Topic;
  newChecklistText: string;
  onNewTextChange: (value: string) => void;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onAdd: () => void;
}

export default function TopicChecklist({
  topic, newChecklistText,
  onNewTextChange, onToggle, onDelete, onAdd,
}: TopicChecklistProps) {
  const statusStyle = statusConfig[topic.status];
  const done = topic.checklist.filter((item) => item.done).length;
  const total = topic.checklist.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckSquare className="h-4 w-4 text-ink-500" /> Checklist
        <span className="text-xs font-normal text-ink-600">({done}/{total})</span>
      </h3>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
        <div
          className={`h-full rounded-full ${statusStyle.dot} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {topic.checklist.map((item) => (
          <div
            key={item.id}
            className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]"
          >
            <button onClick={() => onToggle(item.id)} className="shrink-0">
              {item.done
                ? <CheckSquare className="h-4 w-4 text-emerald-400" />
                : <Square className="h-4 w-4 text-ink-700 transition-colors group-hover:text-ink-500" />
              }
            </button>
            <span className={`flex-1 text-sm ${item.done ? 'text-ink-600 line-through' : 'text-ink-100'}`}>
              {item.text}
            </span>
            <button
              onClick={() => onDelete(item.id)}
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
          onChange={(e) => onNewTextChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
          placeholder="Add checklist item…"
          className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/30 focus:outline-none"
        />
        <button
          onClick={onAdd}
          disabled={!newChecklistText.trim()}
          className="rounded-lg bg-ink-700 p-2 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
