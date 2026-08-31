import { useState } from 'react';
import { Plus, Edit3, ArrowRightLeft, TrendingUp, ChevronDown } from 'lucide-react';
import { historyActionConfig } from '../../config';
import type { HistoryEntry } from '../../types';

const historyIcons: Record<string, typeof Plus> = {
  Plus, Edit3, ArrowRightLeft, TrendingUp,
};

// How many entries are visible in collapsed state
const COLLAPSED_COUNT = 3;

interface TopicHistoryProps {
  history: HistoryEntry[];
}

export default function TopicHistory({ history }: TopicHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) {
    return (
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">History</h3>
        <p className="mt-3 text-xs text-ink-700">No history yet.</p>
      </section>
    );
  }

  // Show newest first
  const sorted = [...history].reverse();
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hiddenCount = sorted.length - COLLAPSED_COUNT;

  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">History</h3>

      <div className="mt-3 space-y-0">
        {visible.map((h, i) => {
          const hcfg = historyActionConfig[h.action];
          const Icon = historyIcons[hcfg.icon] ?? Plus;
          const isLast = i === visible.length - 1;
          return (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-800 ring-1 ring-white/[0.05]">
                  <Icon className={`h-2.5 w-2.5 ${hcfg.color}`} />
                </div>
                {!isLast && <div className="my-0.5 h-full w-px bg-white/[0.04]" />}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-2.5'}`}>
                <span className="text-xs text-ink-400">{h.detail}</span>
                <div className="mt-0.5 font-mono text-[10px] text-ink-700">
                  {h.date.includes('T') ? new Date(h.date).toLocaleString() : h.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / collapse */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-[10px] text-ink-600 transition-colors hover:text-ink-400"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      )}
    </section>
  );
}
