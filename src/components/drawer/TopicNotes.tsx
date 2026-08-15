import { StickyNote } from 'lucide-react';

interface TopicNotesProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export default function TopicNotes({ notes, onChange, onBlur }: TopicNotesProps) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <StickyNote className="h-4 w-4 text-ink-500" /> Notes
      </h3>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Write your insights, summaries, or questions…"
        rows={4}
        className="mt-2 w-full resize-none rounded-xl border border-white/[0.06] bg-ink-800 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-700 transition-colors focus:border-sky-500/30 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
      />
    </section>
  );
}
