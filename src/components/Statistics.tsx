import { useRef, useEffect, useState } from 'react';
import { Clock, Target, Award, Flame, Layers } from 'lucide-react';
import { HEATMAP_COLORS, VISIBLE_STATUS_ORDER } from '../config';
import { generateHeatmap, generateWeeklyActivity, computeStreak, getStudyDates } from '../utils/analytics';

import type { Board, Topic } from '../types';

interface StatisticsProps { topics: Topic[]; boards: Board[]; }

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, decimals = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((ease * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, decimals]);
  return val;
}

// ─── Intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Status colours (chart palette) ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  to_learn:  '#4b5563',
  learning:  '#f59e0b',
  practice:  '#38bdf8',
  completed: '#34d399',
};
const STATUS_LABELS: Record<string, string> = {
  to_learn:  'Backlog',
  learning:  'Learning',
  practice:  'Practicing',
  completed: 'Mastered',
};

// ─── Radar chart ─────────────────────────────────────────────────────────────
function RadarChart({ boards, topics, inView }: { boards: Board[]; topics: Topic[]; inView: boolean }) {
  const cx = 160; const cy = 160; const r = 110;
  const n = boards.length;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!inView || n < 3) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, n]);

  if (n < 3) return <p className="flex h-full items-center justify-center text-xs text-ink-600">Need ≥ 3 boards</p>;

  const pts = boards.map((b, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const bt = topics.filter((t) => t.boardId === b.id);
    const val = bt.length > 0
      ? bt.reduce((s, t) => s + t.progress, 0) / bt.length / 100
      : 0;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), val, label: b.title, angle };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const dataPoints = pts.map((p, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const rv = p.val * progress;
    return { x: cx + r * rv * Math.cos(angle), y: cy + r * rv * Math.sin(angle) };
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[280px] mx-auto">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const gpts = pts.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${i === 0 ? 'M' : 'L'} ${(cx + r * level * Math.cos(angle)).toFixed(1)} ${(cy + r * level * Math.sin(angle)).toFixed(1)}`;
        }).join(' ') + ' Z';
        return <path key={level} d={gpts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Spokes */}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <path d={dataPath} fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#38bdf8" />
      ))}
      {/* Labels */}
      {pts.map((p, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (r + 22) * Math.cos(angle);
        const ly = cy + (r + 22) * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        const name = p.label.length > 10 ? p.label.slice(0, 10) + '…' : p.label;
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fontSize="9" fill="rgba(155,165,184,0.9)" fontFamily="Inter, sans-serif">{name}</text>
        );
      })}
    </svg>
  );
}

// ─── Line chart ───────────────────────────────────────────────────────────────
function LineChart({ data, inView }: {
  data: { week: string; count: number; moved: number; updated: number }[];
  inView: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const W = 520; const H = 160; const PAD = { t: 16, r: 16, b: 32, l: 32 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;
  const maxV = Math.max(...data.map((d) => d.count), 1);

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iW,
    y: PAD.t + iH - (d.count / maxV) * iH,
    ...d,
  }));

  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
  }).join(' ');

  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${PAD.t + iH} L ${pts[0].x} ${PAD.t + iH} Z`;

  useEffect(() => {
    if (!inView || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    pathRef.current.style.strokeDasharray = `${len}`;
    pathRef.current.style.strokeDashoffset = `${len}`;
    pathRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    requestAnimationFrame(() => { pathRef.current!.style.strokeDashoffset = '0'; });
  }, [inView]);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Grid */}
      {gridLines.map((g) => {
        const y = PAD.t + iH * (1 - g);
        return (
          <g key={g}>
            <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.l - 4} y={y} textAnchor="end" dominantBaseline="middle"
              fontSize="8" fill="rgba(130,141,163,0.8)" fontFamily="Inter,sans-serif">
              {Math.round(maxV * g)}
            </text>
          </g>
        );
      })}
      {/* X labels — every 3rd */}
      {pts.map((p, i) => i % 3 === 0 && (
        <text key={i} x={p.x} y={PAD.t + iH + 14} textAnchor="middle"
          fontSize="8" fill="rgba(130,141,163,0.8)" fontFamily="Inter,sans-serif">{p.week}</text>
      ))}
      {/* Area */}
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lg)" opacity={inView ? 1 : 0} style={{ transition: 'opacity 0.6s 0.4s' }} />
      {/* Line */}
      <path ref={pathRef} d={linePath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      {/* Invisible hit targets + dots */}
      {pts.map((p, i) => (
        <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
          <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
          {p.count > 0 && (
            <circle cx={p.x} cy={p.y} r={hovered === i ? 4 : 2.5}
              fill={hovered === i ? '#fff' : '#34d399'}
              stroke={hovered === i ? '#34d399' : 'none'} strokeWidth="1.5" />
          )}
        </g>
      ))}
      {/* Tooltip */}
      {hovered !== null && (() => {
        const p = pts[hovered];
        const ttW = 110; const ttH = 52;
        const tx = Math.min(Math.max(p.x - ttW / 2, 0), W - ttW);
        const ty = p.y - ttH - 10;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={ty} width={ttW} height={ttH} rx="6"
              fill="#1c2029" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x={tx + 8} y={ty + 14} fontSize="9" fill="rgba(155,165,184,0.9)"
              fontFamily="Inter,sans-serif" fontWeight="600">{p.week}</text>
            <circle cx={tx + 12} cy={ty + 27} r="3" fill="#38bdf8" />
            <text x={tx + 20} y={ty + 31} fontSize="8.5" fill="rgba(200,210,225,0.9)"
              fontFamily="Inter,sans-serif">Moved</text>
            <text x={tx + ttW - 8} y={ty + 31} fontSize="8.5" fill="white"
              fontFamily="Inter,sans-serif" fontWeight="700" textAnchor="end">{p.moved}</text>
            <circle cx={tx + 12} cy={ty + 42} r="3" fill="#34d399" />
            <text x={tx + 20} y={ty + 46} fontSize="8.5" fill="rgba(200,210,225,0.9)"
              fontFamily="Inter,sans-serif">Updated</text>
            <text x={tx + ttW - 8} y={ty + 46} fontSize="8.5" fill="white"
              fontFamily="Inter,sans-serif" fontWeight="700" textAnchor="end">{p.updated}</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ─── Stacked horizontal bar ───────────────────────────────────────────────────
function StackedBar({ segments, inView, delay = 0 }: {
  segments: { status: string; count: number; pct: number }[];
  inView: boolean;
  delay?: number;
}) {
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-full bg-ink-700/40">
      {segments.filter((s) => s.pct > 0).map((s) => (
        <div
          key={s.status}
          title={`${STATUS_LABELS[s.status]}: ${s.count}`}
          style={{
            width: inView ? `${s.pct}%` : '0%',
            backgroundColor: STATUS_COLORS[s.status],
            transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── This week bar chart ──────────────────────────────────────────────────────
function WeekBars({ topics, inView }: { topics: Topic[]; inView: boolean }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [hovered, setHovered] = useState<number | null>(null);
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const counts = days.map((_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    // Count unique topics that had real study activity on this day
    return topics.filter((t) =>
      getStudyDates(t).some((d) => d >= dayStart && d < dayEnd),
    ).length;
  });

  const maxC = Math.max(...counts, 1);
  const todayIdx = dayOfWeek;

  return (
    <div className="relative flex h-36 items-end gap-2 pt-4">
      {days.map((day, i) => (
        <div
          key={day}
          className="relative flex flex-1 flex-col items-center gap-1.5"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Tooltip */}
          {hovered === i && counts[i] > 0 && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-center shadow-lg z-10">
              <div className="text-[10px] font-semibold text-ink-300">{day}</div>
              <div className="text-sm font-bold text-white">{counts[i]}</div>
            </div>
          )}
          <div className="relative flex w-full justify-center" style={{ height: '100px' }}>
            {counts[i] > 0 ? (
              <div
                className="w-full max-w-[28px] rounded-t-md"
                style={{
                  height: inView ? `${Math.max((counts[i] / maxC) * 100, 8)}%` : '0%',
                  backgroundColor: i === todayIdx ? '#38bdf8' : 'rgba(56,189,248,0.25)',
                  transition: `height 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                }}
              />
            ) : (
              // Empty placeholder — no visual artifact
              <div className="w-full max-w-[28px]" />
            )}
          </div>
          <span className={`text-[9px] tabular-nums ${i === todayIdx ? 'text-sky-300 font-semibold' : 'text-ink-600'}`}>
            {day}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, inView }: {
  segments: { status: string; count: number; pct: number }[];
  inView: boolean;
}) {
  const r = 52; const cx = 70; const cy = 70;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView]);

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[140px]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="18" />
      {segments.filter((s) => s.pct > 0).map((s) => {
        const dash = (s.pct / 100) * circ * progress;
        const gap = circ - dash;
        const el = (
          <circle key={s.status} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={STATUS_COLORS[s.status]}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * progress * circ / 100 + circ * 0.25}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
          />
        );
        offset += s.pct;
        return el;
      })}
    </svg>
  );
}

// ─── Main Statistics component ────────────────────────────────────────────────
export default function Statistics({ topics, boards }: StatisticsProps) {
  const weeklyActivity = generateWeeklyActivity(topics);
  const activityHeatmap = generateHeatmap(topics);
  const avgActivity = (weeklyActivity.reduce((s, w) => s + w.count, 0) / weeklyActivity.length).toFixed(1);
  const totalSessions = activityHeatmap.reduce((s, v) => s + v, 0);
  void totalSessions;
  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const inProgressCount = topics.filter((t) => t.status === 'learning' || t.status === 'practice').length;
  const totalTopics = topics.length;
  const { current: currentStreak } = computeStreak(topics);
  const avgProgress = totalTopics > 0
    ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / totalTopics)
    : 0;

  // Count-up values
  const animAvg = useCountUp(parseFloat(avgActivity), 900, 1);
  const animProgress = useCountUp(avgProgress);
  const animInProgress = useCountUp(inProgressCount);
  const animStreak = useCountUp(currentStreak);
  const animCompleted = useCountUp(completedCount);

  // Board breakdown
  const boardStats = boards.map((b) => {
    const bt = topics.filter((t) => t.boardId === b.id);
    const total = bt.length;
    const segs = VISIBLE_STATUS_ORDER.map((st) => {
      const count = bt.filter((t) => t.status === st).length;
      return { status: st, count, pct: total > 0 ? (count / total) * 100 : 0 };
    });
    const avgP = total > 0
      ? Math.round(bt.reduce((s, t) => s + t.progress, 0) / total)
      : 0;
    return { ...b, total, segs, avgP };
  }).sort((a, b) => b.total - a.total);

  // Donut segments
  const donutSegs = VISIBLE_STATUS_ORDER.map((st) => ({
    status: st,
    count: topics.filter((t) => t.status === st).length,
    pct: totalTopics > 0 ? (topics.filter((t) => t.status === st).length / totalTopics) * 100 : 0,
  }));

  // Section visibility
  const { ref: topRef, inView: topInView } = useInView();
  const { ref: lineRef, inView: lineInView } = useInView();
  const { ref: weekRef, inView: weekInView } = useInView();
  const { ref: boardRef, inView: boardInView } = useInView();
  const { ref: radarRef, inView: radarInView } = useInView();
  const { ref: donutRef, inView: donutInView } = useInView();
  const { ref: heatRef, inView: heatInView } = useInView();

  const colorMap = {
    sky:     'bg-sky-500/15 text-sky-300 ring-sky-500/20',
    teal:    'bg-teal-500/15 text-teal-300 ring-teal-500/20',
    amber:   'bg-amber-500/15 text-amber-300 ring-amber-500/20',
    rose:    'bg-rose-500/15 text-rose-300 ring-rose-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20',
  } as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white">Statistics</h1>
        <p className="mt-1.5 text-sm text-ink-500">Track your learning velocity and mastery over time.</p>
      </div>

      {/* ── Top stat cards ── */}
      <div ref={topRef} className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {([
          { icon: Clock,  label: 'Avg topics / week', value: `${animAvg}`,         color: 'sky'     },
          { icon: Target, label: 'Avg progress',      value: `${animProgress}%`,   color: 'teal'    },
          { icon: Layers, label: 'In progress',       value: `${animInProgress}`,  color: 'amber'   },
          { icon: Flame,  label: 'Current streak',    value: `${animStreak}d`,     color: 'rose'    },
          { icon: Award,  label: 'Mastered',          value: `${animCompleted}`,   color: 'emerald' },
        ] as const).map((stat, i) => (
          <div
            key={stat.label}
            className="surface rounded-2xl p-4"
            style={{
              opacity: topInView ? 1 : 0,
              transform: topInView ? 'none' : 'translateY(12px)',
              transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms`,
            }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${colorMap[stat.color]}`}>
              <stat.icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="mt-4 text-3xl font-bold tabular-nums text-white">{stat.value}</div>
            <div className="mt-0.5 text-xs text-ink-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Line chart + This week bars ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Line chart — Weekly activity */}
        <div ref={lineRef} className="surface rounded-2xl p-5 lg:col-span-2"
          style={{ opacity: lineInView ? 1 : 0, transform: lineInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <h2 className="text-sm font-semibold text-white">Weekly activity</h2>
          <p className="mt-0.5 text-xs text-ink-500">Topics updated over the last 12 weeks</p>
          <div className="mt-4">
            <LineChart data={weeklyActivity} inView={lineInView} />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-xs text-ink-500">Moved (status change)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-ink-500">Updated</span>
            </div>
          </div>
        </div>

        {/* This week bars */}
        <div ref={weekRef} className="surface rounded-2xl p-5"
          style={{ opacity: weekInView ? 1 : 0, transform: weekInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s 0.1s, transform 0.6s 0.1s' }}>
          <h2 className="text-sm font-semibold text-white">This week</h2>
          <p className="mt-0.5 text-xs text-ink-500">Topics updated per day</p>
          <WeekBars topics={topics} inView={weekInView} />
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-3">
            <span className="text-xs text-ink-600">Total this week</span>
            <span className="text-sm font-bold tabular-nums text-white">
              {(() => {
                const now = new Date();
                const wStart = new Date(now);
                wStart.setDate(now.getDate() - (now.getDay() + 6) % 7);
                wStart.setHours(0, 0, 0, 0);
                // Count unique topics with real study activity this week
                return topics.filter((t) =>
                  getStudyDates(t).some((d) => d >= wStart),
                ).length;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Board breakdown + Radar + Donut ── */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Board breakdown — stacked horizontal bars */}
        <div ref={boardRef} className="surface rounded-2xl p-5"
          style={{ opacity: boardInView ? 1 : 0, transform: boardInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <h2 className="text-sm font-semibold text-white">Board breakdown</h2>
          <p className="mt-0.5 text-xs text-ink-500">Topics by status per board</p>
          <div className="mt-5 space-y-3.5">
            {boardStats.length === 0
              ? <p className="text-xs text-ink-600">No boards yet</p>
              : boardStats.map((b, i) => (
                <div key={b.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-ink-400 truncate max-w-[120px]">{b.title}</span>
                    <span className="text-[10px] tabular-nums text-ink-600">{b.avgP}%</span>
                  </div>
                  <StackedBar segments={b.segs} inView={boardInView} delay={i * 80} />
                </div>
              ))
            }
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-white/[0.04] pt-3">
            {VISIBLE_STATUS_ORDER.map((st) => (
              <div key={st} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[st] }} />
                <span className="text-[10px] text-ink-500">{STATUS_LABELS[st]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar — Skill coverage */}
        <div ref={radarRef} className="surface rounded-2xl p-5"
          style={{ opacity: radarInView ? 1 : 0, transform: radarInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s 0.1s, transform 0.6s 0.1s' }}>
          <h2 className="text-sm font-semibold text-white">Skill coverage</h2>
          <p className="mt-0.5 text-xs text-ink-500">Avg progress by board</p>
          <div className="mt-2 flex items-center justify-center">
            <RadarChart boards={boards} topics={topics} inView={radarInView} />
          </div>
        </div>

        {/* Donut — Topic status */}
        <div ref={donutRef} className="surface rounded-2xl p-5"
          style={{ opacity: donutInView ? 1 : 0, transform: donutInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s 0.2s, transform 0.6s 0.2s' }}>
          <h2 className="text-sm font-semibold text-white">Topic status</h2>
          <p className="mt-0.5 text-xs text-ink-500">All topics across all boards</p>
          <div className="mt-4 flex items-center gap-5">
            <DonutChart segments={donutSegs} inView={donutInView} />
            <div className="flex flex-col gap-2.5">
              {donutSegs.map((s) => (
                <div key={s.status} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                  <span className="text-xs text-ink-300">{STATUS_LABELS[s.status]}</span>
                  <span className="ml-auto pl-2 text-xs font-semibold tabular-nums text-white">{s.count}</span>
                  <span className="w-7 text-right text-[10px] text-ink-600">{Math.round(s.pct)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Activity heatmap (unchanged) ── */}
      <div ref={heatRef} className="surface mt-6 rounded-2xl p-5"
        style={{ opacity: heatInView ? 1 : 0, transform: heatInView ? 'none' : 'translateY(16px)', transition: 'opacity 0.6s, transform 0.6s' }}>
        <h2 className="text-sm font-semibold text-white">Activity heatmap</h2>
        <p className="mt-0.5 text-xs text-ink-500">Last 36 weeks of updates</p>
        <div className="mt-4 flex gap-0.5 overflow-x-auto pb-1">
          {Array.from({ length: 36 }, (_, w) => (
            <div key={w} className="flex flex-col gap-0.5">
              {Array.from({ length: 7 }, (_, d) => {
                const idx = w * 7 + d;
                const val = activityHeatmap[idx] ?? 0;
                return (
                  <div
                    key={d}
                    className="h-2.5 w-2.5 rounded-[2px] transition-colors"
                    style={{ backgroundColor: HEATMAP_COLORS[val] ?? HEATMAP_COLORS[0] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-[10px] text-ink-600">Less</span>
          {HEATMAP_COLORS.map((c, i) => (
            <div key={i} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-ink-600">More</span>
        </div>
      </div>
    </div>
  );
}
