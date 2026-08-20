import { TrendingUp, Clock, Target, Award, Flame, Layers } from 'lucide-react';
import { boardColorMap, statusConfig, HEATMAP_COLORS, VISIBLE_STATUS_ORDER } from '../config';
import { generateHeatmap, generateWeeklyActivity, computeStreak } from '../utils/analytics';
import { STATUS_PROGRESS } from '../utils/status';
import type { Board, Topic } from '../types';

const difficultyColors: Record<string, string> = {
  easy:   'from-emerald-500/60 to-emerald-400',
  medium: 'from-amber-500/60 to-amber-400',
  hard:   'from-rose-500/60 to-rose-400',
};

interface StatisticsProps {
  boards: Board[];
  topics: Topic[];
}

export default function Statistics({ boards, topics }: StatisticsProps) {
  const weeklyActivity = generateWeeklyActivity(topics);
  const activityHeatmap = generateHeatmap(topics);
  const maxActivity = Math.max(...weeklyActivity.map((w) => w.count), 1);
  const avgActivity = (weeklyActivity.reduce((s, w) => s + w.count, 0) / weeklyActivity.length).toFixed(1);
  const totalSessions = activityHeatmap.reduce((s, v) => s + v, 0);
  void totalSessions; // kept for potential future use
  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const inProgressCount = topics.filter((t) => t.status === 'learning' || t.status === 'practice').length;
  const totalTopics = topics.length;
  const { current: currentStreak } = computeStreak(topics);
  // Average progress across all topics derived from status (STATUS_PROGRESS map)
  const avgProgress = totalTopics > 0
    ? Math.round(topics.reduce((sum, t) => sum + STATUS_PROGRESS[t.status], 0) / totalTopics)
    : 0;
  const circumference = 2 * Math.PI * 52;

  const boardStats = boards.map((b) => {
    const boardTopics = topics.filter((t) => t.boardId === b.id);
    const avgProgress = boardTopics.length > 0
      ? Math.round(boardTopics.reduce((sum, t) => sum + STATUS_PROGRESS[t.status], 0) / boardTopics.length)
      : 0;
    return { ...b, pct: avgProgress };
  });

  const statusDistribution = VISIBLE_STATUS_ORDER.map((status) => ({
    status,
    count: topics.filter((t) => t.status === status).length,
  }));
  const totalStatus = statusDistribution.reduce((s, d) => s + d.count, 0);

  const difficultyDistribution = (['easy', 'medium', 'hard'] as const).map((difficulty) => ({
    difficulty,
    count: topics.filter((t) => t.difficulty === difficulty).length,
  }));
  const totalDifficulty = difficultyDistribution.reduce((s, d) => s + d.count, 0);


  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white">Statistics</h1>
        <p className="mt-1.5 text-sm text-ink-500">Track your learning velocity and mastery over time.</p>
      </div>

      {/* Top stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {([
          { icon: Clock,    label: 'Avg topics / week', value: avgActivity,          color: 'sky' },
          { icon: Target,   label: 'Avg progress',      value: `${avgProgress}%`,    color: 'teal' },
          { icon: Layers,   label: 'In progress',       value: inProgressCount,      color: 'amber' },
          { icon: Flame,    label: 'Current streak',    value: `${currentStreak}d`,  color: 'rose' },
          { icon: Award,    label: 'Mastered',          value: completedCount,        color: 'emerald' },
        ] as const).map((stat, i) => {
          const colorMap = {
            sky:     'bg-sky-500/15 text-sky-300 ring-sky-500/20',
            teal:    'bg-teal-500/15 text-teal-300 ring-teal-500/20',
            amber:   'bg-amber-500/15 text-amber-300 ring-amber-500/20',
            rose:    'bg-rose-500/15 text-rose-300 ring-rose-500/20',
            emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20',
          } as const;
          return (
            <div key={i} className="surface animate-fade-up rounded-2xl p-5" style={{ animationDelay: `${100 + i * 100}ms` }}>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${colorMap[stat.color]}`}>
                  <stat.icon className="h-5 w-5" strokeWidth={2} />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold tabular-nums text-white">{stat.value}</div>
              <div className="mt-0.5 text-xs text-ink-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Weekly activity bar chart */}
        <div className="surface animate-fade-up animate-delay-200 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Weekly activity</h2>
              <p className="mt-0.5 text-xs text-ink-500">Topics updated per week — last 12 weeks</p>
            </div>
            <span className="chip bg-emerald-500/10 text-emerald-300">
              <TrendingUp className="h-3 w-3" /> Tracking
            </span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {weeklyActivity.map((w, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-500/30 to-emerald-400/80 transition-all duration-300 hover:from-emerald-500/50 hover:to-emerald-300"
                    style={{ height: `${(w.count / maxActivity) * 160}px`, minHeight: w.count > 0 ? 4 : 0 }}
                  />
                  {w.count > 0 && (
                    <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink-700 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {w.count}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-ink-600">{w.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status donut */}
        <div className="surface animate-fade-up animate-delay-300 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">Status breakdown</h2>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative h-36 w-36">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-ink-700" />
                <circle
                  cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                  className="stroke-emerald-400 transition-all duration-700"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * avgProgress) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-white">{avgProgress}%</span>
                <span className="mt-0.5 text-[10px] text-ink-600">avg progress</span>
                <span className="text-[10px] text-ink-600">completed</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              {statusDistribution.map((d) => {
                const s = statusConfig[d.status];
                const pct = totalStatus > 0 ? Math.round((d.count / totalStatus) * 100) : 0;
                return (
                  <div key={d.status} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <span className="flex-1 text-xs text-ink-400">{s.label}</span>
                    <span className="text-xs tabular-nums text-ink-600">{d.count}</span>
                    <span className="w-8 text-right text-xs tabular-nums text-ink-500">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Board mastery */}
        <div className="surface animate-fade-up animate-delay-300 rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Progress by board</h2>
          <p className="mt-0.5 text-xs text-ink-500">Average status progress per board</p>
          <div className="mt-4 space-y-3">
            {boardStats.map((b) => {
              const c = boardColorMap[b.color] ?? boardColorMap.sky;
              return (
                <div key={b.id} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 truncate text-sm text-ink-200">{b.title}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full ${c.dot} transition-all duration-700`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-500">{b.pct}%</span>
                </div>
              );
            })}
            {boardStats.length === 0 && (
              <p className="py-4 text-center text-xs text-ink-600">No boards yet</p>
            )}
          </div>
        </div>

        {/* Difficulty distribution */}
        <div className="surface animate-fade-up animate-delay-400 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white">Difficulty spread</h2>
          <p className="mt-0.5 text-xs text-ink-500">Topics by complexity</p>
          <div className="mt-5 space-y-3">
            {difficultyDistribution.map((d) => {
              const pct = totalDifficulty > 0 ? Math.round((d.count / totalDifficulty) * 100) : 0;
              return (
                <div key={d.difficulty}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-ink-400">{d.difficulty}</span>
                    <span className="tabular-nums text-ink-600">{d.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${difficultyColors[d.difficulty]} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full heatmap */}
      <div className="surface animate-fade-up animate-delay-500 mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Activity heatmap</h2>
            <p className="mt-0.5 text-xs text-ink-500">Daily learning activity over 36 weeks</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-600">
            <span>Less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="mt-5 flex gap-[3px] overflow-x-auto pb-2">
          {Array.from({ length: 36 }).map((_, week) => (
            <div key={week} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, day) => {
                const idx = week * 7 + day;
                const v = activityHeatmap[idx] ?? 0;
                return (
                  <div
                    key={day}
                    className={`h-3 w-3 rounded-sm ${HEATMAP_COLORS[v]} transition-transform hover:scale-125`}
                    title={`${v} update${v !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
