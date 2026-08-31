import { useRef, useState } from 'react';
import { Tag, Plus, X, CalendarDays, AlertTriangle } from 'lucide-react';
import { difficultyConfig, boardColorMap } from '../../config';
import type { Difficulty, Topic, Board } from '../../types';

interface TopicPropertiesProps {
  topic: Topic;
  board: Board | undefined;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onDeadlineDateChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TopicProperties({
  topic, board,
  onDifficultyChange,
  onDeadlineDateChange,
  onAddTag, onRemoveTag,
}: TopicPropertiesProps) {
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;

  // ── Deadline ────────────────────────────────────────────────────────────────
  const dateInputRef = useRef<HTMLInputElement>(null);

  const isOverdue = topic.deadlineDate
    ? new Date(topic.deadlineDate) < new Date(new Date().toDateString())
    : false;

  const formattedDeadline = topic.deadlineDate
    ? new Date(topic.deadlineDate).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagInputVisible, setTagInputVisible] = useState(false);
  const [tagValue, setTagValue] = useState('');
  // Prevent onBlur from hiding the input when the user is clicking the + button
  const skipBlurRef = useRef(false);

  function doAddTag() {
    const tag = tagValue.trim().toLowerCase();
    if (tag && !topic.tags.includes(tag)) onAddTag(tag);
    setTagValue('');
    tagInputRef.current?.focus();
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      doAddTag();
    }
    if (e.key === 'Escape') {
      setTagInputVisible(false);
      setTagValue('');
    }
  }

  function handleTagBlur() {
    // skipBlurRef is set in onPointerDown of the + button — by the time onBlur
    // fires (synchronously after pointer events) the ref is already true.
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (!tagValue.trim()) setTagInputVisible(false);
  }

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Properties</h3>
      <div className="mt-3 space-y-3">

        {/* ── Difficulty ── */}
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

        {/* ── Deadline ── */}
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-ink-500">Deadline</span>
          <div className="flex-1">
            {/*
              <label htmlFor="topic-deadline-input"> is the only truly
              reliable cross-browser way to open a date picker: clicking a
              label with a matching htmlFor triggers the native picker without
              any JS, without z-index fights, and without showPicker() gesture
              restrictions. The input is visually hidden via width/height 0 +
              overflow hidden (NOT sr-only / clip:rect which blocks pickers).
            */}
            <input
              id="topic-deadline-input"
              ref={dateInputRef}
              type="date"
              value={topic.deadlineDate ?? ''}
              onChange={(e) => onDeadlineDateChange(e.target.value)}
              style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
              tabIndex={-1}
            />
            {formattedDeadline ? (
              <div className={`flex w-full items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                isOverdue
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border-white/[0.08] bg-ink-800 text-ink-200'
              }`}>
                {isOverdue
                  ? <AlertTriangle className="h-3 w-3 shrink-0" />
                  : <CalendarDays className="h-3 w-3 shrink-0 text-ink-500" />
                }
                <label
                  htmlFor="topic-deadline-input"
                  className="flex-1 cursor-pointer hover:underline"
                >
                  {formattedDeadline}
                </label>
                <button
                  onClick={() => onDeadlineDateChange('')}
                  className="ml-auto shrink-0 opacity-50 transition-opacity hover:opacity-100"
                  title="Clear deadline"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="topic-deadline-input"
                className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-white/[0.15] hover:text-ink-400"
              >
                <CalendarDays className="h-3 w-3" />
                Add deadline…
              </label>
            )}
          </div>
        </div>

        {/* ── Tags ── */}
        <div className="flex items-start gap-3">
          <span className="mt-1.5 w-20 shrink-0 text-xs text-ink-500">Tags</span>
          <div className="flex-1 space-y-2">
            {topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`chip ${boardColors.bg} ${boardColors.text} border ${boardColors.border} group`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onPointerDown={(e) => { e.preventDefault(); onRemoveTag(tag); }}
                      className="ml-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                      title={`Remove "${tag}"`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {tagInputVisible ? (
              <div className="flex items-center gap-2">
                <input
                  ref={tagInputRef}
                  autoFocus
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleTagBlur}
                  placeholder="Add tag…"
                  className="flex-1 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
                />
                <button
                  onPointerDown={() => { skipBlurRef.current = true; }}
                  onClick={doAddTag}
                  disabled={!tagValue.trim()}
                  className="rounded-lg bg-ink-700 p-1.5 text-ink-400 transition-colors hover:bg-ink-600 hover:text-white disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setTagInputVisible(true)}
                className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.06] px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-white/[0.12] hover:text-ink-400"
              >
                <Plus className="h-3 w-3" />
                Add tag…
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
