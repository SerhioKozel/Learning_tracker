import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { boardColorMap } from '../config';
import { generateCalendarEvents, generateAllCalendarEvents } from '../utils/analytics';
import type { CalendarEvent, Topic, Board } from '../types';

interface CalendarViewProps {
  topics: Topic[];
  boards: Board[];
  onSelectTopic: (id: string) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Visual config per event type
const eventConfig = {
  deadline: {
    dot: 'bg-rose-400',
    text: 'text-rose-300',
    chipBg: 'bg-rose-500/15',
    border: 'border-rose-500/20',
    label: 'Deadline',
  },
  completed: {
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    chipBg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    label: 'Mastered',
  },
} as const;

export default function CalendarView({ topics, boards, onSelectTopic }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allEvents = generateAllCalendarEvents(topics);
  const upcomingEvents = generateCalendarEvents(topics);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter((e) => e.date === dateStr);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedEvents = selectedDate ? allEvents.filter((e) => e.date === selectedDate) : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(todayStr); };

  const getBoardColor = (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    return board ? boardColorMap[board.color] : boardColorMap.sky;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="animate-fade-up flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1.5 text-sm text-ink-500">Deadlines and completed topics.</p>
        </div>
        <button onClick={goToToday} className="btn-soft text-xs">Today</button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* ── Calendar grid ── */}
        <div className="surface animate-fade-up animate-delay-100 rounded-2xl p-5 lg:col-span-2">

          {/* Month nav */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{monthNames[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={nextMonth} className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-white">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="mt-4 grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-600">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;

              const dayEvents = eventsForDate(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;

              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`group relative flex aspect-square flex-col items-center justify-start rounded-lg border p-1 transition-all ${
                    isSelected
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : isToday
                        ? 'border-sky-500/30 bg-sky-500/[0.06]'
                        : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Day number */}
                  <span className={`text-sm tabular-nums ${
                    isToday ? 'font-bold text-sky-300' : hasEvents ? 'font-semibold text-ink-100' : 'text-ink-500'
                  }`}>
                    {day}
                  </span>

                  {/* Topic name chips — board colour */}
                  {hasEvents && (
                    <div className="mt-0.5 flex w-full flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((e) => {
                        const colors = getBoardColor(e.boardId);
                        const cfg = eventConfig[e.type];
                        return (
                          <span
                            key={`${e.topicId}-${e.type}`}
                            className={`flex w-full items-center gap-0.5 truncate rounded px-1 py-px text-[10px] font-medium leading-tight ${colors.bg} ${colors.text}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                            <span className="truncate">{e.title}</span>
                          </span>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="w-full px-1 text-[9px] leading-tight text-ink-600">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-5 border-t border-white/[0.04] pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-xs text-ink-500">Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-ink-500">Completed</span>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Selected day detail */}
          {selectedDate && (
            <div className="surface animate-scale-in rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </h3>
              <div className="mt-3 space-y-2">
                {selectedEvents.length > 0 ? selectedEvents.map((e) => {
                  const colors = getBoardColor(e.boardId);
                  const board = boards.find((b) => b.id === e.boardId);
                  const cfg = eventConfig[e.type];
                  return (
                    <button
                      key={`${e.topicId}-${e.type}`}
                      onClick={() => onSelectTopic(e.topicId)}
                      className={`flex w-full items-center gap-3 rounded-xl border ${cfg.chipBg} ${cfg.border} p-3 text-left transition-all hover:brightness-110`}
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink-100">{e.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                          <span className={cfg.text}>{cfg.label}</span>
                          {board && (
                            <>
                              <span className="text-ink-700">·</span>
                              <span className={colors.text}>{board.title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                }) : (
                  <p className="text-xs text-ink-600">No events on this day.</p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming deadlines */}
          <div className="surface animate-fade-up animate-delay-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white">Upcoming deadlines</h3>
            <div className="mt-4 space-y-1">
              {upcomingEvents.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-600">No upcoming deadlines</p>
              ) : upcomingEvents.map((e) => {
                const colors = getBoardColor(e.boardId);
                const d = new Date(e.date + 'T00:00:00');
                const isToday = e.date === todayStr;
                return (
                  <button
                    key={e.topicId}
                    onClick={() => { setSelectedDate(e.date); onSelectTopic(e.topicId); }}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex w-10 shrink-0 flex-col items-center">
                      <span className="text-[9px] uppercase text-ink-600">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className={`text-base font-bold tabular-nums leading-none ${isToday ? 'text-sky-300' : 'text-ink-100'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-white/[0.06] pl-3">
                      <div className={`truncate text-sm font-medium ${colors.text} group-hover:brightness-110`}>
                        {e.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-rose-400/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        {isToday ? 'Due today' : 'Deadline'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
