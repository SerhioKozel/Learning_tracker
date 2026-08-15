import { CheckSquare, Link2, Clock } from 'lucide-react';
import { statusConfig, topicTypeConfig, difficultyConfig } from '../../config';
import type { Topic } from '../../types';

export default function CardContent({ topic }: { topic: Topic }) {
  const s = statusConfig[topic.status];
  const tc = topicTypeConfig[topic.type];
  const d = difficultyConfig[topic.difficulty];
  const checklistDone = topic.checklist.filter((c) => c.done).length;
  const checklistTotal = topic.checklist.length;

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="chip border border-ink-600/40 bg-ink-700/40 text-[10px] text-ink-300">
          {tc.label}
        </span>
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
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-ink-600">
          <span>Progress</span>
          <span className="tabular-nums">{topic.progress}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-700">
          <div
            className={`h-full rounded-full ${s.dot} transition-all duration-500`}
            style={{ width: `${topic.progress}%` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-2.5">
        <div className="flex items-center gap-3">
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-ink-600">
              <CheckSquare className="h-3 w-3" /> {checklistDone}/{checklistTotal}
            </span>
          )}
          {topic.resources.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-ink-600">
              <Link2 className="h-3 w-3" /> {topic.resources.length}
            </span>
          )}
          {topic.reviewDate && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/70">
              <Clock className="h-3 w-3" /> {topic.reviewDate.slice(5)}
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
