import { Flag } from 'lucide-react';
import { difficultyConfig } from '../../config';
import { getDeadlineUrgency } from '../../utils/deadline';
import type { Topic } from '../../types';

export default function CardContent({ topic }: { topic: Topic }) {
  const d = difficultyConfig[topic.difficulty];

  const hasChecklist = topic.checklist.length > 0;
  const doneCount = topic.checklist.filter((c) => c.done).length;
  const totalCount = topic.checklist.length;
  const pct = hasChecklist ? Math.round((doneCount / totalCount) * 100) : 0;
  const progressColor = pct === 100 ? 'bg-emerald-400' : 'bg-sky-400/70';

  const urgency = getDeadlineUrgency(topic.deadlineDate);
  const deadlineTextColor =
    urgency === 'overdue' ? 'text-rose-400'
    : urgency === 'soon' ? 'text-amber-400'
    : urgency === 'normal' ? 'text-emerald-400'
    : 'text-ink-600';

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

      {/* Checklist mini-progress bar */}
      {hasChecklist && (
        <div className="mt-2.5 space-y-1">
          <div className="h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-700">{doneCount}/{totalCount}</span>
            <span className="text-[10px] text-ink-700">{pct}%</span>
          </div>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {topic.deadlineDate && (
            <span className={`flex items-center gap-1 text-[10px] ${deadlineTextColor}`}>
              <Flag className="h-3 w-3" />
              {urgency === 'overdue' ? 'Overdue' : topic.deadlineDate.slice(5)}
            </span>
          )}
        </div>
        {topic.tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
            {topic.tags.map((tag, i) => (
              <span key={tag} className="flex items-center gap-1.5 text-[10px] text-ink-600">
                {i > 0 && <span className="text-ink-800">·</span>}
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
