import {
  Target, Flame, ChevronRight, Plus,
  Calendar, CheckCircle, Layers, Layout,
} from 'lucide-react';
import { boardColorMap, statusConfig, topicTypeConfig, HEATMAP_COLORS, BOARD_ICONS } from '../config';
import { generateHeatmap, generateWeeklyActivity, computeStreak } from '../utils/analytics';

import type { Board, Topic } from '../types';

interface DashboardProps {
  boards: Board[];
  topics: Topic[];
  onNavigate: (path: string) => void;
  onSelectBoard: (id: string) => void;
  onSelectTopic: (id: string) => void;
}

export default function Dashboard({ boards, topics, onNavigate, onSelectBoard, onSelectTopic }: DashboardProps) {
  const totalTopics = topics.length;
  const completed = topics.filter((t) => t.status === 'completed').length;
  const inProgress = topics.filter((t) => t.status === 'learning' || t.status === 'practice').length;
  const totalProgress = totalTopics > 0
    ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / totalTopics)
    : 0;

  const { current: streak, best: bestStreak } = computeStreak(topics);

  const recentTopics = [...topics].slice(0, 5);

  const upcomingReviews = topics
    .filter((t) => t.reviewDate)
    .sort((a, b) => (a.reviewDate! < b.reviewDate! ? -1 : 1))
    .slice(0, 5);

  const activityHeatmap = generateHeatmap(topics);
  const weeklyActivity = generateWeeklyActivity(topics);
  const maxActivity = Math.max(...weeklyActivity.map((w) => w.count), 1);
  const totalSessions = activityHeatmap.reduce((s, v) => s + v, 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const weekNum = Math.ceil(
    (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  if (boards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-24">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/20">
            <Layers className="h-8 w-8 text-sky-300" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">Welcome to Learning Tracker</h1>
          <p className="mt-2 text-sm text-ink-500">
            Organise everything you want to learn into boards, track your progress, and never lose a resource again.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Create a board', description: 'Group topics by subject — e.g. "Frontend", "Algorithms", "System Design".', action: () => onNavigate('/boards'), label: 'Create board' },
            { step: '2', title: 'Add topics', description: 'Each topic is a card that moves through five stages: To Learn → Completed.' },
            { step: '3', title: 'Track & review', description: 'Set review dates, log resources, write notes, and watch your progress grow.' },
          ].map((item) => (
            <div key={item.step} className="surface rounded-2xl p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold text-sky-300">
                {item.step}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{item.description}</p>
              {item.action && (
                <button onClick={item.action} className="btn-primary mt-4 w-full justify-center">
                  <Plus className="h-4 w-4" /> {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalTopics === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-8 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/20">
          <Layers className="h-8 w-8 text-sky-300" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Your boards are ready</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          You have {boards.length} board{boards.length !== 1 ? 's' : ''} set up. Now add your first topic to start tracking.
        </p>
        <button onClick={() => onNavigate('/boards')} className="btn-primary mt-6">
          <Plus className="h-4 w-4" /> Open boards
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-600">
          <span>{today}</span>
          <span className="h-1 w-1 rounded-full bg-ink-700" />
          <span>Week {weekNum}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white text-balance">
          {streak > 0 ? `${streak}-day streak. Keep it going.` : 'Your learning dashboard'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {totalTopics} topic{totalTopics !== 1 ? 's' : ''} across {boards.length} board{boards.length !== 1 ? 's' : ''}
          {inProgress > 0 ? ` · ${inProgress} in progress` : ''}
        </p>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Average progress */}
        <div className="surface animate-fade-up animate-delay-100 group card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20">
              <Target className="h-5 w-5 text-rose-300" strokeWidth={2} />
            </div>
            <span className="chip bg-rose-500/10 text-rose-300">
              avg
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tabular-nums text-white">{totalProgress}%</div>
            <div className="mt-0.5 text-xs text-ink-500">Average progress</div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

        {/* Active topics */}
        <div className="surface animate-fade-up animate-delay-200 card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-500/20">
              <Layers className="h-5 w-5 text-sky-300" strokeWidth={2} />
            </div>
            <span className="chip bg-sky-500/10 text-sky-300">active</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tabular-nums text-white">{inProgress}</div>
            <div className="mt-0.5 text-xs text-ink-500">Active topics</div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {topics.filter((t) => t.status === 'learning' || t.status === 'practice').slice(0, 6).map((t) => (
              <div key={t.id} className={`h-1.5 flex-1 rounded-full ${statusConfig[t.status].dot}`} />
            ))}
          </div>
        </div>

        {/* Completed */}
        <div className="surface animate-fade-up animate-delay-300 card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-300" strokeWidth={2} />
            </div>
            <span className="chip bg-emerald-500/10 text-emerald-300">done</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tabular-nums text-white">{completed}</div>
            <div className="mt-0.5 text-xs text-ink-500">Completed topics</div>
          </div>
          <div className="mt-3 flex h-8 items-end gap-1">
            {weeklyActivity.slice(-7).map((w, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500/40 to-emerald-400/80"
                style={{ height: `${(w.count / maxActivity) * 100}%`, minHeight: 2 }}
              />
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className="surface animate-fade-up animate-delay-400 card-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
              <Flame className="h-5 w-5 text-amber-300" strokeWidth={2} />
            </div>
            {bestStreak > 0 && (
              <span className="chip bg-amber-500/10 text-amber-300">
                Best: {bestStreak}d
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tabular-nums text-white">
              {streak}<span className="text-lg text-ink-500"> days</span>
            </div>
            <div className="mt-0.5 text-xs text-ink-500">Current streak</div>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < streak ? 'bg-amber-400' : 'bg-ink-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent boards */}
        <div className="surface animate-fade-up animate-delay-200 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent boards</h2>
            <button onClick={() => onNavigate('/boards')} className="btn-ghost text-xs">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {boards.slice(0, 4).map((b) => {
              const c = boardColorMap[b.color] ?? boardColorMap.sky;
              const Icon = BOARD_ICONS[b.icon] ?? Layout;
              const pct = b.topicCount > 0 ? Math.round((b.completedCount / b.topicCount) * 100) : 0;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBoard(b.id)}
                  className={`group relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.gradient} p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.border} border`}>
                      <Icon className={`h-4.5 w-4.5 ${c.text}`} strokeWidth={2} />
                    </div>
                    <span className="text-xs tabular-nums text-ink-500">{b.completedCount}/{b.topicCount}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-white">{b.title}</h3>
                  <p className="mt-1 text-xs text-ink-500 line-clamp-1">{b.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-700">
                      <div className={`h-full rounded-full ${c.text.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-ink-500">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming reviews */}
        <div className="surface animate-fade-up animate-delay-300 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="h-4 w-4 text-amber-300" /> Upcoming reviews
            </h2>
            <button onClick={() => onNavigate('/calendar')} className="btn-ghost text-xs">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {upcomingReviews.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-600">No reviews scheduled</p>
            ) : upcomingReviews.map((t) => {
              const s = statusConfig[t.status];
              const b = boards.find((b) => b.id === t.boardId);
              const c = b ? boardColorMap[b.color] : boardColorMap.sky;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTopic(t.id)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex w-12 shrink-0 flex-col items-center">
                    <span className="text-[10px] uppercase text-ink-600">{t.reviewDate!.slice(5, 7)}</span>
                    <span className="text-lg font-bold tabular-nums leading-none text-ink-100">{t.reviewDate!.slice(8)}</span>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-white/[0.06] pl-3">
                    <div className="truncate text-sm font-medium text-ink-100 group-hover:text-white">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-600">
                      <span className={c.text}>{b?.title}</span>
                      <span className="h-1 w-1 rounded-full bg-ink-700" />
                      <span className={s.text}>{s.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity + Recent topics */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Heatmap */}
        <div className="surface animate-fade-up animate-delay-300 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Learning activity</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                {totalSessions} update{totalSessions !== 1 ? 's' : ''} in the last 36 weeks
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-600">
              <span>Less</span>
              {HEATMAP_COLORS.map((c, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>
          <div className="mt-5 flex gap-[3px]">
            {Array.from({ length: 36 }).map((_, week) => (
              <div key={week} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, day) => {
                  const idx = week * 7 + day;
                  const v = activityHeatmap[idx] ?? 0;
                  return (
                    <div
                      key={day}
                      className={`h-2.5 w-2.5 rounded-sm ${HEATMAP_COLORS[v]} transition-transform hover:scale-125`}
                      title={`${v} update${v !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Recently updated */}
        <div className="surface animate-fade-up animate-delay-400 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">Recently updated</h2>
          <div className="mt-4 space-y-1">
            {recentTopics.map((t) => {
              const s = statusConfig[t.status];
              const b = boards.find((b) => b.id === t.boardId);
              const c = b ? boardColorMap[b.color] : boardColorMap.sky;
              const tc = topicTypeConfig[t.type];
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTopic(t.id)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-100 group-hover:text-white">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-600">
                      <span className={c.text}>{b?.title}</span>
                      <span className="h-1 w-1 rounded-full bg-ink-700" />
                      <span>{tc.label}</span>
                      <span className="h-1 w-1 rounded-full bg-ink-700" />
                      <span>{t.updatedAt}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
