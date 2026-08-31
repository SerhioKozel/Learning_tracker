import { useState, useRef, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Plus } from 'lucide-react';
import type { Topic } from '../../types';

interface TopicChecklistProps {
  topic: Topic;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onAdd: (text: string) => void;
}

export default function TopicChecklist({ topic, onToggle, onDelete, onAdd }: TopicChecklistProps) {
  const [inputVisible, setInputVisible] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurRef = useRef(false);

  const done  = topic.checklist.filter((c) => c.done).length;
  const total = topic.checklist.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const progressColor = pct === 100 ? 'bg-emerald-400' : 'bg-sky-400';

  useEffect(() => {
    if (inputVisible) inputRef.current?.focus();
  }, [inputVisible]);

  function doAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); doAdd(); }
    if (e.key === 'Escape') { setInputVisible(false); setText(''); }
  }

  function handleBlur() {
    if (skipBlurRef.current) { skipBlurRef.current = false; return; }
    if (!text.trim()) setInputVisible(false);
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">
          Checklist
          {total > 0 && (
            <span className="ml-1.5 font-normal normal-case text-ink-700">{done}/{total}</span>
          )}
        </h3>
        <button
          onClick={() => setInputVisible((v) => !v)}
          className="rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.05] hover:text-ink-400"
          title="Add item"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {total > 0 && (
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-ink-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {total > 0 && (
        <div className="mt-2 space-y-0.5">
          {topic.checklist.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
            >
              <button
                onClick={() => onToggle(item.id)}
                className="shrink-0 transition-transform active:scale-90"
              >
                {item.done
                  ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                  : <Square className="h-3.5 w-3.5 text-ink-700 transition-colors group-hover:text-ink-500" />
                }
              </button>
              <span className={`flex-1 text-xs leading-snug ${
                item.done ? 'text-ink-600 line-through' : 'text-ink-200'
              }`}>
                {item.text}
              </span>
              <button
                onPointerDown={(e) => { e.preventDefault(); onDelete(item.id); }}
                className="rounded p-1 text-ink-700 opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-400 group-hover:opacity-100"
                title="Remove item"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {inputVisible && (
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="Add item…"
            className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
          />
          <button
            onPointerDown={() => { skipBlurRef.current = true; }}
            onClick={doAdd}
            disabled={!text.trim()}
            className="rounded-lg bg-ink-700 p-1.5 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {total === 0 && !inputVisible && (
        <button
          onClick={() => setInputVisible(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.06] px-3 py-2 text-xs text-ink-600 transition-colors hover:border-white/[0.12] hover:text-ink-400"
        >
          <Plus className="h-3 w-3" /> Add checklist item…
        </button>
      )}
    </section>
  );
}
