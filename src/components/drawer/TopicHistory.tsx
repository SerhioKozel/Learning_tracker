import { Plus, Edit3, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { historyActionConfig } from '../../config';
import type { HistoryEntry } from '../../types';

const historyIcons: Record<string, typeof Plus> = {
  Plus, Edit3, ArrowRightLeft, TrendingUp,
};

interface TopicHistoryProps {
  history: HistoryEntry[];
}

export default function TopicHistory({ history }: TopicHistoryProps) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">History</h3>
      <div className="mt-3 space-y-0">
        {history.length === 0 && (
          <p className="py-3 text-xs text-ink-600">No history yet — changes will appear here.</p>
        )}
        {history.map((h, i) => {
          const hcfg = historyActionConfig[h.action];
          const Icon = historyIcons[hcfg.icon] ?? Plus;
          const isLast = i === history.length - 1;
          return (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-800 ring-1 ring-white/[0.05]">
                  <Icon className={`h-3 w-3 ${hcfg.color}`} />
                </div>
                {!isLast && <div className="my-0.5 h-full w-px bg-white/[0.04]" />}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
                <span className="text-xs text-ink-400">{h.detail}</span>
                <div className="mt-0.5 font-mono text-[10px] text-ink-700">
                  {h.date.includes('T') ? new Date(h.date).toLocaleString() : h.date}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
