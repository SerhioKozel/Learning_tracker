import { ChevronDown, Tag, Plus, X } from 'lucide-react';
import { topicTypeConfig, difficultyConfig, boardColorMap, statusConfig } from '../../config';
import type { TopicType, Difficulty, Topic, Board } from '../../types';

interface TopicPropertiesProps {
  topic: Topic;
  board: Board | undefined;
  localProgress: number;
  newTag: string;
  onTypeChange: (type: TopicType) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onProgressChange: (value: number) => void;
  onProgressCommit: (value: number) => void;
  onReviewDateChange: (value: string) => void;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export default function TopicProperties({
  topic, board,
  localProgress, newTag,
  onTypeChange, onDifficultyChange,
  onProgressChange, onProgressCommit,
  onReviewDateChange,
  onNewTagChange, onAddTag, onRemoveTag,
}: TopicPropertiesProps) {
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;
  const statusStyle = statusConfig[topic.status];

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Properties</h3>
      <div className="mt-3 space-y-3">

        {/* Type */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Type</span>
          <div className="relative flex-1">
            <select
              value={topic.type}
              onChange={(e) => onTypeChange(e.target.value as TopicType)}
              className="w-full appearance-none rounded-lg border border-white/[0.06] bg-ink-800 py-2 pl-3 pr-8 text-sm text-ink-100 transition-colors focus:border-sky-500/30 focus:outline-none"
            >
              {Object.entries(topicTypeConfig).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-ink-700">{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          </div>
        </div>

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

        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Progress</span>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700">
                <div
                  className={`h-full rounded-full ${statusStyle.dot} transition-all duration-300`}
                  style={{ width: `${localProgress}%` }}
                />
              </div>
              <span className="w-9 text-right text-sm font-semibold tabular-nums text-white">
                {localProgress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={localProgress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              onPointerUp={(e) => onProgressCommit(Number((e.target as HTMLInputElement).value))}
              className="w-full accent-sky-400"
            />
          </div>
        </div>

        {/* Review date */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Review</span>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="date"
              value={topic.reviewDate ?? ''}
              onChange={(e) => onReviewDateChange(e.target.value)}
              className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-2 text-sm text-ink-100 transition-colors focus:border-sky-500/30 focus:outline-none [color-scheme:dark]"
            />
            {topic.reviewDate && (
              <button
                onClick={() => onReviewDateChange('')}
                className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-300"
                title="Clear review date"
              >
                <X className="h-3.5 w-3.5" />
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
