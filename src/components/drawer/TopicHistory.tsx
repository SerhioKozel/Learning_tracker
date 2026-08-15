import { History, Plus, Edit3, ArrowRightLeft, TrendingUp } from 'lucide-react';
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
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <History className="h-4 w-4 text-ink-500" /> History
      </h3>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700 ring-1 ring-white/[0.05]">
                  <Icon className={`h-3.5 w-3.5 ${hcfg.color}`} />
                </div>
                {!isLast && <div className="my-0.5 h-full w-px bg-white/[0.06]" />}
              </div>
              <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
                <div className="text-sm font-medium text-ink-100">{hcfg.label}</div>
                <div className="mt-0.5 text-xs text-ink-600">{h.detail}</div>
                <div className="mt-0.5 font-mono text-xs text-ink-700">
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
