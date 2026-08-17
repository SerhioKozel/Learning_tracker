import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { statusConfig } from '../config';
import { generateCalendarEvents } from '../utils/analytics';
import type { CalendarEvent, Topic } from '../types';

interface CalendarViewProps {
  topics: Topic[];
  onSelectTopic: (id: string) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const eventTypeConfig: Record<CalendarEvent['type'], { icon: typeof Clock; color: string; bg: string; text: string; dot: string; label: string }> = {
  review: { icon: Clock, color: 'amber', bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-400', label: 'Review' },
  completed: { icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Completed' },
};

export default function CalendarView({ topics, onSelectTopic }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarEvents = generateCalendarEvents(topics);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: (number | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedEvents = selectedDate
    ? calendarEvents.filter((e) => e.date === selectedDate)
    : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(todayStr); };

  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      {/* Header */}
      <div className="animate-fade-up flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1.5 text-sm text-ink-500">Review schedule, deadlines, and completed topics.</p>
        </div>
        <button onClick={goToToday} className="btn-soft text-xs">
          Today
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar grid */}
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
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-lg border p-1 transition-all ${
                    isSelected
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : isToday
                        ? 'border-sky-500/30 bg-sky-500/[0.06]'
                        : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`text-sm tabular-nums ${isToday ? 'font-bold text-sky-300' : hasEvents ? 'font-semibold text-ink-100' : 'text-ink-500'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="mt-1 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.topicId} className={`h-1 w-1 rounded-full ${eventTypeConfig[e.type].dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-4 border-t border-white/[0.04] pt-4">
            {Object.values(eventTypeConfig).map((cfg) => (
              <div key={cfg.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-ink-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — events list */}
        <div className="space-y-4">
          {/* Selected date events */}
          {selectedDate && (
            <div className="surface animate-scale-in rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <div className="mt-3 space-y-2">
                {selectedEvents.length > 0 ? selectedEvents.map((e) => {
                  const cfg = eventTypeConfig[e.type];
                  const topic = topics.find((t) => t.id === e.topicId);
                  return (
                    <button
                      key={e.topicId}
                      onClick={() => onSelectTopic(e.topicId)}
                      className={`flex w-full items-center gap-3 rounded-xl border ${cfg.bg} border-white/[0.04] p-3 text-left transition-all hover:border-white/[0.08]`}
                    >
                      <cfg.icon className={`h-4 w-4 shrink-0 ${cfg.text}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink-100">{e.title}</div>
                        <div className={`text-xs ${cfg.text}`}>
                          {cfg.label}
                          {topic && <span className="text-ink-600"> · {statusConfig[topic.status].label}</span>}
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

          {/* All upcoming events */}
          <div className="surface animate-fade-up animate-delay-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white">All events</h3>
            <div className="mt-4 space-y-1">
              {calendarEvents.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-600">No scheduled reviews yet</p>
              ) : calendarEvents.map((e) => {
                const cfg = eventTypeConfig[e.type];
                const d = new Date(e.date + 'T00:00:00');
                return (
                  <button
                    key={e.topicId}
                    onClick={() => { setSelectedDate(e.date); onSelectTopic(e.topicId); }}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex w-10 shrink-0 flex-col items-center">
                      <span className="text-[9px] uppercase text-ink-600">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-base font-bold tabular-nums leading-none text-ink-100">{d.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-white/[0.06] pl-3">
                      <div className="truncate text-sm font-medium text-ink-100 group-hover:text-white">{e.title}</div>
                      <div className={`mt-0.5 flex items-center gap-1 text-xs ${cfg.text}`}>
                        <cfg.icon className="h-3 w-3" /> {cfg.label}
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
