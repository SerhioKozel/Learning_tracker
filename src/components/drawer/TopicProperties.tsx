import { useRef, useState, useEffect } from 'react';
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
  /** Returns up to 5 matching system-tag names for the given query. */
  onSearchTags: (query: string) => Promise<string[]>;
}

export default function TopicProperties({
  topic, board,
  onDifficultyChange,
  onDeadlineDateChange,
  onAddTag, onRemoveTag,
  onSearchTags,
}: TopicPropertiesProps) {
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [tagInputVisible, setTagInputVisible] = useState(false);
  const [tagValue, setTagValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  // Set in onPointerDown of the + button / a suggestion — prevents onBlur
  // from hiding the input/dropdown before the click handler fires.
  const skipBlurRef = useRef(false);
  // Guards against a slow, stale search response overwriting a fresher one
  const searchSeqRef = useRef(0);

  const alreadyHasTag = (name: string) =>
    topic.tags.some((t) => t.toLowerCase() === name.toLowerCase());

  // Debounced autocomplete search against system tags
  useEffect(() => {
    const query = tagValue.trim();
    if (!query) { setSuggestions([]); setHighlightIndex(-1); return; }

    const seq = ++searchSeqRef.current;
    const timer = setTimeout(async () => {
      const results = await onSearchTags(query);
      if (seq !== searchSeqRef.current) return; // a newer search superseded this one
      setSuggestions(results.filter((r) => !alreadyHasTag(r)));
      setHighlightIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagValue]);

  function commitTag(name: string) {
    if (name.trim() && !alreadyHasTag(name)) onAddTag(name.trim());
    setTagValue('');
    setSuggestions([]);
    setHighlightIndex(-1);
    tagInputRef.current?.focus();
  }

  function doAddTag() {
    // If a suggestion is highlighted, commit that one (preserves canonical casing).
    if (highlightIndex >= 0 && suggestions[highlightIndex]) {
      commitTag(suggestions[highlightIndex]);
      return;
    }
    commitTag(tagValue.trim().toLowerCase());
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      doAddTag();
    } else if (e.key === 'Escape') {
      if (suggestions.length > 0) { setSuggestions([]); setHighlightIndex(-1); }
      else { setTagInputVisible(false); setTagValue(''); }
    }
  }

  function handleTagBlur() {
    if (skipBlurRef.current) { skipBlurRef.current = false; return; }
    setSuggestions([]);
    if (!tagValue.trim()) setTagInputVisible(false);
  }

  // ── Deadline ────────────────────────────────────────────────────────────────
  const isOverdue = topic.deadlineDate
    ? new Date(topic.deadlineDate) < new Date(new Date().toDateString())
    : false;

  const formattedDeadline = topic.deadlineDate
    ? new Date(topic.deadlineDate).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

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
          <div className="relative flex-1">
            <input
              id="deadline-picker"
              type="date"
              value={topic.deadlineDate ?? ''}
              onChange={(e) => onDeadlineDateChange(e.target.value)}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '1px', height: '1px',
                opacity: 0,
                pointerEvents: 'none',
              }}
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
                <label htmlFor="deadline-picker" className="flex-1 cursor-pointer hover:underline">
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
                htmlFor="deadline-picker"
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
              <div className="relative">
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

                {/* Autocomplete dropdown — up to 5 matching system tags */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-white/[0.08] bg-ink-800 shadow-lift">
                    {suggestions.map((name, i) => (
                      <button
                        key={name}
                        onPointerDown={() => { skipBlurRef.current = true; }}
                        onClick={() => commitTag(name)}
                        onMouseEnter={() => setHighlightIndex(i)}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                          i === highlightIndex ? 'bg-sky-500/15 text-sky-300' : 'text-ink-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        <Tag className="h-3 w-3 shrink-0 text-ink-600" />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
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
