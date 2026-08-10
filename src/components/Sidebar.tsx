import { useState } from 'react';
import {
  LayoutDashboard, KanbanSquare, BarChart3,
  Calendar, Settings, GraduationCap, Search, Plus,
} from 'lucide-react';
import { boardColorMap } from '../config';
import type { Board, Topic } from '../types';

// The View type is exported here because Sidebar is the canonical list of views.
export type View = 'dashboard' | 'boards' | 'board' | 'stats' | 'calendar' | 'settings';

interface SidebarProps {
  view: View;
  onView: (v: View) => void;
  activeBoardId: string | null;
  onSelectBoard: (id: string) => void;
  boards: Board[];
  topics: Topic[];
  loading: boolean;
}

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'boards',    label: 'Boards',    icon: KanbanSquare },
  { id: 'stats',     label: 'Statistics', icon: BarChart3 },
  { id: 'calendar',  label: 'Calendar',  icon: Calendar },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar({
  view, onView, activeBoardId, onSelectBoard, boards, loading,
}: SidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="glass flex h-full w-64 shrink-0 flex-col border-r border-white/[0.06]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-glow">
          <GraduationCap className="h-5 w-5 text-always-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-always-white">Learning</div>
          <div className="text-xs text-ink-500">Tracker</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pb-2">
        {navItems.map((item) => {
          const active = view === item.id || (item.id === 'boards' && view === 'board');
          return (
            <button
              key={item.id}
              onClick={() => onView(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-white/[0.07] text-white'
                  : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sky-400" />
              )}
              <item.icon
                className={`h-[18px] w-[18px] transition-colors ${active ? 'text-sky-400' : 'text-ink-500 group-hover:text-ink-200'}`}
                strokeWidth={2}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Boards list */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">Boards</span>
          <button
            onClick={() => onView('boards')}
            className="rounded-md p-1 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative mb-2 px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter boards…"
            className="w-full rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-8 pr-3 text-xs text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-3">
          {loading ? (
            <div className="space-y-2 px-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-800/60" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-ink-600">
              {query ? 'No boards match' : 'No boards yet'}
            </div>
          ) : (
            filtered.map((b) => {
              const c = boardColorMap[b.color] ?? boardColorMap.sky;
              const active = activeBoardId === b.id && view === 'board';
              const pct = b.topicCount > 0 ? Math.round((b.completedCount / b.topicCount) * 100) : 0;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBoard(b.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                    active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.border} border`}>
                    <span className={`h-2 w-2 rounded-full ${c.text.replace('text-', 'bg-')}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-xs font-medium ${active ? 'text-white' : 'text-ink-200'}`}>
                      {b.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                        <div
                          className={`h-full rounded-full ${c.text.replace('text-', 'bg-')}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] tabular-nums text-ink-600">{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer — placeholder for future auth */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-xs font-bold text-always-white">
            LT
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-ink-100">Learning Tracker</div>
            <div className="truncate text-[10px] text-ink-600">Connected · Supabase</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
