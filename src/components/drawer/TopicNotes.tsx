import { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface TopicNotesProps {
  notes: string;
  topicId: string; // used to reset state when topic changes
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function TopicNotes({ notes, topicId, onChange, onBlur }: TopicNotesProps) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a different topic is opened, collapse so we don't auto-expand into
  // an empty textarea. If the new topic has notes, shouldShow handles display.
  useEffect(() => {
    setExpanded(false);
  }, [topicId]);

  // Show textarea if user explicitly expanded OR the topic already has notes
  // (so existing content is always readable without an extra click).
  const shouldShow = expanded || !!notes;

  function handleExpand() {
    setExpanded(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Notes</h3>
        {!shouldShow && (
          <button
            onClick={handleExpand}
            className="rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.05] hover:text-ink-400"
            title="Add note"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {shouldShow ? (
        <div className="relative mt-2">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              onBlur();
              if (!notes.trim()) setExpanded(false);
            }}
            placeholder="Write your insights, summaries, or questions…"
            rows={5}
            className="w-full resize-none rounded-xl border border-white/[0.06] bg-ink-800 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-700 transition-colors focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
          {notes.length > 0 && (
            <span className="pointer-events-none absolute bottom-2.5 right-3 select-none font-mono text-[10px] text-ink-700">
              {notes.length}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={handleExpand}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.06] px-3 py-2 text-xs text-ink-600 transition-colors hover:border-white/[0.12] hover:text-ink-400"
        >
          <Plus className="h-3 w-3" />
          Add note…
        </button>
      )}
    </section>
  );
}
