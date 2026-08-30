import { useRef, useEffect, useState } from 'react';

interface TopicNotesProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function TopicNotes({ notes, onChange, onBlur }: TopicNotesProps) {
  const [expanded, setExpanded] = useState(!!notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = notes.length;

  // If notes get populated externally (e.g. topic switch), always show textarea
  useEffect(() => {
    if (notes) setExpanded(true);
  }, [notes]);

  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Notes</h3>

      {expanded ? (
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
          {charCount > 0 && (
            <span className="absolute bottom-2.5 right-3 font-mono text-[10px] text-ink-700 select-none">
              {charCount}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.06] px-3 py-2 text-xs text-ink-600 transition-colors hover:border-white/[0.12] hover:text-ink-400"
        >
          Add note…
        </button>
      )}
    </section>
  );
}
