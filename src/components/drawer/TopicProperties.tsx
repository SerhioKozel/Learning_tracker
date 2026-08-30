import { useRef } from 'react';
import { Tag, Plus, X, CalendarDays, AlertTriangle } from 'lucide-react';
import { difficultyConfig, boardColorMap } from '../../config';
import type { Difficulty, Topic, Board } from '../../types';

interface TopicPropertiesProps {
  topic: Topic;
  board: Board | undefined;
  newTag: string;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onDeadlineDateChange: (value: string) => void;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export default function TopicProperties({
  topic, board,
  newTag,
  onDifficultyChange,
  onDeadlineDateChange,
  onNewTagChange, onAddTag, onRemoveTag,
}: TopicPropertiesProps) {
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isOverdue = topic.deadlineDate
    ? new Date(topic.deadlineDate) < new Date(new Date().toDateString())
    : false;

  const formattedDeadline = topic.deadlineDate
    ? new Date(topic.deadlineDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Properties</h3>
      <div className="mt-3 space-y-3">

        {/* Difficulty */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Difficulty</span>
          <div className="flex flex-1 gap-1.5">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const cfg = difficultyConfig[d];
              const active = topic.difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={`chip border transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                      : 'border-white/[0.06] text-ink-600 hover:text-ink-400'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline — custom trigger */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Deadline</span>
          <div className="relative flex-1">
            {/* Hidden native date input — triggered programmatically */}
            <input
              ref={dateInputRef}
              type="date"
              value={topic.deadlineDate ?? ''}
              onChange={(e) => onDeadlineDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 [color-scheme:dark]"
              tabIndex={-1}
            />

            {formattedDeadline ? (
              /* Chip with date + clear button */
              <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                isOverdue
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-white/[0.08] bg-ink-800 text-ink-200'
              }`}>
                {isOverdue
                  ? <AlertTriangle className="h-3 w-3 shrink-0" />
                  : <CalendarDays className="h-3 w-3 shrink-0 text-ink-500" />
                }
                <button
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="hover:underline"
                >
                  {formattedDeadline}
                </button>
                <button
                  onClick={() => onDeadlineDateChange('')}
                  className="ml-0.5 rounded-full text-current opacity-50 transition-opacity hover:opacity-100"
                  title="Clear deadline"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              /* Empty state trigger */
              <button
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] px-2.5 py-1.5 text-xs text-ink-600 transition-colors hover:border-white/[0.15] hover:text-ink-400"
              >
                <CalendarDays className="h-3 w-3" />
                Add deadline…
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-start gap-3">
          <span className="mt-2 w-20 shrink-0 text-xs text-ink-500">Tags</span>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {topic.tags.map((tag) => (
                <span
                  key={tag}
                  className={`chip ${boardColors.bg} ${boardColors.text} border ${boardColors.border} group`}
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => onRemoveTag(tag)}
                    className="ml-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                    title={`Remove "${tag}"`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAddTag(); }
                }}
                placeholder="Add tag…"
                className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
              />
              <button
                onClick={onAddTag}
                disabled={!newTag.trim()}
                className="rounded-lg bg-ink-700 p-1.5 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
