import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Plus } from 'lucide-react';

interface TopicNotesProps {
  notes: string;
  topicId: string; // used to reset state when topic changes
  onChange: (value: string) => void;
  onBlur: () => void;
}

// Height bounds for auto-resize, in pixels — roughly 2 lines minimum (so an
// empty/just-opened field doesn't look cramped) and 12 lines maximum (past
// that, a long note scrolls internally instead of pushing the rest of the
// drawer further down).
const MIN_HEIGHT = 52;
const MAX_HEIGHT = 260;

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

  // Auto-resize: grow the textarea to fit its content instead of always
  // reserving a fixed number of rows. A one-line note no longer sits inside
  // a mostly-empty 5-row box; a long note grows up to MAX_HEIGHT, then
  // scrolls internally rather than growing forever.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !shouldShow) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)}px`;
  }, [notes, shouldShow]);

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
            rows={1}
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
            className="w-full resize-none overflow-y-auto rounded-xl border border-white/[0.06] bg-ink-800 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-700 transition-colors focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
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
