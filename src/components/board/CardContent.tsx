import { Flag } from 'lucide-react';
import { difficultyConfig } from '../../config';
import type { Topic } from '../../types';

export default function CardContent({ topic }: { topic: Topic }) {
  const d = difficultyConfig[topic.difficulty];

  return (
    <>
      <div className="mb-2 flex items-center justify-end">
        <span className={`chip border text-[10px] ${d.bg} ${d.text} ${d.border}`}>
          {d.label}
        </span>
      </div>
      <h4 className="text-sm font-semibold leading-snug text-ink-100 group-hover:text-white">
        {topic.title}
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-ink-500 line-clamp-2">
        {topic.description || 'No description yet'}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
        <div className="flex items-center gap-3">
          {/* Checklist counter — hidden in MVP, code preserved for future use */}
          <span className="hidden flex items-center gap-1 text-[10px] text-ink-600" />
          {/* Resource counter — hidden in MVP, code preserved for future use */}
          <span className="hidden flex items-center gap-1 text-[10px] text-ink-600" />
          {topic.deadlineDate && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400/80">
              <Flag className="h-3 w-3" /> {topic.deadlineDate.slice(5)}
            </span>
          )}
        </div>
        {topic.tags.length > 0 && (
          <span className="text-[10px] text-ink-600">{topic.tags[0]}</span>
        )}
      </div>
    </>
  );
}
