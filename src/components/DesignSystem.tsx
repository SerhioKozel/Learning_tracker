import { Check, AlertTriangle, XCircle, Info, Search, Bell, Star } from 'lucide-react';

const colorRamps: { name: string; shades: string[]; prefix: string }[] = [
  { name: 'Sky (Primary accent / interactive)', prefix: 'sky', shades: ['200', '300', '400', '500', '600'] },
  { name: 'Teal (Secondary accent / in-progress)', prefix: 'teal', shades: ['200', '300', '400', '500', '600'] },
  { name: 'Emerald (Success / mastered)', prefix: 'emerald', shades: ['200', '300', '400', '500', '600'] },
  { name: 'Amber (Warning / review)', prefix: 'amber', shades: ['200', '300', '400', '500', '600'] },
  { name: 'Rose (Destructive / high-difficulty)', prefix: 'rose', shades: ['200', '300', '400', '500', '600'] },
  { name: 'Ink (Surface / text / borders)', prefix: 'ink', shades: ['100', '200', '400', '500', '600', '700', '800', '900', '950', '980'] },
];

export default function DesignSystem() {
  return (
    <div className="mx-auto max-w-7xl px-8 py-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white">Design System</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          The visual language powering Learning Tracker — colors, type, components, and motion.
        </p>
      </div>

      {/* Color ramps */}
      <section className="mt-8 animate-fade-up animate-delay-100">
        <h2 className="text-sm font-semibold text-white">Color ramps</h2>
        <p className="mt-0.5 text-xs text-ink-500">6 semantic ramps — sky / teal for accents, emerald / amber / rose for status, and ink for all surfaces, text, and borders.</p>
        <div className="mt-4 space-y-4">
          {colorRamps.map((ramp) => (
            <div key={ramp.prefix} className="surface rounded-2xl p-4">
              <div className="mb-3 text-xs font-medium text-ink-400">{ramp.name}</div>
              <div className="flex flex-wrap gap-1.5">
                {ramp.shades.map((shade) => (
                  <div key={shade} className="group relative">
                    <div
                      className={`h-12 w-12 rounded-lg bg-${ramp.prefix}-${shade} ring-1 ring-inset ring-white/[0.06] transition-transform group-hover:scale-110`}
                    />
                    <div className="mt-1 text-center text-[9px] tabular-nums text-ink-600">{shade}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mt-8 animate-fade-up animate-delay-200">
        <h2 className="text-sm font-semibold text-white">Typography</h2>
        <p className="mt-0.5 text-xs text-ink-500">Inter — 3 weights · 150% body / 120% heading line-height</p>
        <div className="mt-4 surface rounded-2xl p-6">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Display · 3xl / Bold / -0.02em</span>
              <div className="mt-1 text-3xl font-bold tracking-tight text-white">Master your craft, one topic at a time</div>
            </div>
            <div className="border-t border-white/[0.04] pt-5">
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Heading · xl / Semibold</span>
              <div className="mt-1 text-xl font-semibold text-white">React Server Components</div>
            </div>
            <div className="border-t border-white/[0.04] pt-5">
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Body · sm / Regular / 150%</span>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">
                Understand the RSC model, streaming, and the app router mental model. The key insight is that
                RSCs render on the server and stream a serialized format — not HTML.
              </p>
            </div>
            <div className="border-t border-white/[0.04] pt-5">
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Caption · xs / Medium / Tabular</span>
              <div className="mt-1 text-xs font-medium tabular-nums text-ink-500">5h / 12h · Updated 1h ago · 4/5 difficulty</div>
            </div>
            <div className="border-t border-white/[0.04] pt-5">
              <span className="text-[10px] uppercase tracking-wider text-ink-600">Mono · JetBrains Mono · xs</span>
              <div className="mt-1 font-mono text-xs text-ink-400">const mastery = Math.round((mastered / total) * 100);</div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="mt-8 animate-fade-up animate-delay-300">
        <h2 className="text-sm font-semibold text-white">Buttons & inputs</h2>
        <div className="mt-4 surface rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary">Primary action</button>
            <button className="btn-soft">Secondary</button>
            <button className="btn-ghost">Ghost</button>
            <button className="btn-primary" disabled>Disabled</button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
              <input
                placeholder="Search topics…"
                className="w-64 rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-9 pr-3 text-sm text-ink-100 placeholder:text-ink-600 transition-colors focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              />
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Chips & badges */}
      <section className="mt-8 animate-fade-up animate-delay-400">
        <h2 className="text-sm font-semibold text-white">Chips & status badges</h2>
        <div className="mt-4 surface rounded-2xl p-6">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-ink-700/40 text-ink-400 border border-ink-600/40"><span className="h-1.5 w-1.5 rounded-full bg-ink-500" />Backlog</span>
            <span className="chip bg-amber-500/15 text-amber-300 border border-amber-500/30"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Learning</span>
            <span className="chip bg-sky-500/15 text-sky-300 border border-sky-500/30"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />Practicing</span>
            <span className="chip bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Mastered</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip bg-sky-500/15 text-sky-300 border border-sky-500/30">React</span>
            <span className="chip bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">TypeScript</span>
            <span className="chip bg-amber-500/15 text-amber-300 border border-amber-500/30">Algorithms</span>
            <span className="chip bg-teal-500/15 text-teal-300 border border-teal-500/30">Postgres</span>
            <span className="chip bg-rose-500/15 text-rose-300 border border-rose-500/30">AWS</span>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="mt-8 animate-fade-up animate-delay-500">
        <h2 className="text-sm font-semibold text-white">Alerts & feedback</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <div className="text-sm font-medium text-emerald-200">Topic mastered</div>
              <div className="mt-0.5 text-xs text-emerald-300/70">Graph Algorithms moved to Mastered. Nice work!</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="text-sm font-medium text-amber-200">Streak at risk</div>
              <div className="mt-0.5 text-xs text-amber-300/70">Study today to maintain your 23-day streak.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <div className="text-sm font-medium text-rose-200">Sync failed</div>
              <div className="mt-0.5 text-xs text-rose-300/70">Couldn't reach the server. Your changes are saved locally.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.08] p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
            <div>
              <div className="text-sm font-medium text-sky-200">New feature</div>
              <div className="mt-0.5 text-xs text-sky-300/70">You can now link external resources to any topic.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Motion */}
      <section className="mt-8 animate-fade-up animate-delay-700">
        <h2 className="text-sm font-semibold text-white">Motion</h2>
        <p className="mt-0.5 text-xs text-ink-500">Cubic-bezier(0.16, 1, 0.3, 1) — smooth deceleration. Durations: 200ms / 300ms / 400ms.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: 'fade-up', class: 'animate-fade-up' },
            { name: 'fade-in', class: 'animate-fade-in' },
            { name: 'scale-in', class: 'animate-scale-in' },
            { name: 'slide-in', class: 'animate-slide-in-right' },
          ].map((m) => (
            <div key={m.name} className="surface rounded-xl p-4 text-center">
              <div className={`mx-auto h-12 w-12 rounded-xl bg-sky-500/20 ring-1 ring-sky-500/30 ${m.class}`} />
              <div className="mt-2 text-xs text-ink-500">{m.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing & elevation */}
      <section className="mt-8 animate-fade-up animate-delay-700 mb-4">
        <h2 className="text-sm font-semibold text-white">Elevation & spacing</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="surface rounded-2xl p-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-ink-700 shadow-card" />
            <div className="mt-3 text-xs font-medium text-ink-200">Card</div>
            <div className="text-[10px] text-ink-600">Default surface</div>
          </div>
          <div className="surface rounded-2xl p-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-ink-700 shadow-lift" />
            <div className="mt-3 text-xs font-medium text-ink-200">Lift</div>
            <div className="text-[10px] text-ink-600">Hover / raised</div>
          </div>
          <div className="surface rounded-2xl p-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-sky-500/30 shadow-glow" />
            <div className="mt-3 text-xs font-medium text-ink-200">Glow</div>
            <div className="text-[10px] text-ink-600">Primary focus</div>
          </div>
        </div>
        <div className="mt-4 surface rounded-2xl p-5">
          <div className="text-xs font-medium text-ink-400">8px spacing scale</div>
          <div className="mt-3 flex items-end gap-2">
            {[1, 2, 3, 4, 6, 8, 12].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="rounded bg-sky-500/30" style={{ width: `${n * 4}px`, height: `${n * 4}px` }} />
                <span className="text-[9px] tabular-nums text-ink-600">{n * 8}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-700">
        <Star className="h-3 w-3" />
        <span>Learning Tracker · Design Concept v1.0</span>
        <Star className="h-3 w-3" />
      </div>
    </div>
  );
}
