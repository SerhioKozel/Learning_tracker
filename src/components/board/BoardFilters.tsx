import { useRef, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { difficultyConfig } from '../../config';
import type { Difficulty } from '../../types';

interface BoardFiltersProps {
  query: string;
  filterDifficulty: Difficulty | null;
  filterOpen: boolean;
  onQueryChange: (value: string) => void;
  onFilterOpenChange: (open: boolean) => void;
  onDifficultyChange: (d: Difficulty | null) => void;
  onClearAll: () => void;
}

export default function BoardFilters({
  query, filterDifficulty, filterOpen,
  onQueryChange, onFilterOpenChange,
  onDifficultyChange, onClearAll,
}: BoardFiltersProps) {
  const filterRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = filterDifficulty ? 1 : 0;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        onFilterOpenChange(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [onFilterOpenChange]);

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search topics…"
          className="w-44 rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-8 pr-3 text-xs text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/40 focus:outline-none"
        />
      </div>

      {/* Filter dropdown */}
      <div ref={filterRef} className="relative">
        <button
          onClick={() => onFilterOpenChange(!filterOpen)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            activeFilterCount > 0
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              : 'border-white/[0.06] bg-ink-800/60 text-ink-400 hover:text-ink-100'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filterOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-52 animate-scale-in rounded-xl border border-white/[0.08] bg-ink-700 p-3 shadow-lift">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Filters</span>
              {activeFilterCount > 0 && (
                <button onClick={onClearAll} className="text-[10px] text-sky-400 hover:text-sky-300">
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {/* Difficulty */}
              <div>
                <div className="mb-1.5 text-[10px] font-medium text-ink-500">Difficulty</div>
                <div className="flex gap-1">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                    const cfg = difficultyConfig[d];
                    return (
                      <button
                        key={d}
                        onClick={() => onDifficultyChange(filterDifficulty === d ? null : d)}
                        className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-colors ${
                          filterDifficulty === d
                            ? `${cfg.bg} ${cfg.text}`
                            : 'bg-ink-800 text-ink-400 hover:text-ink-100'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
