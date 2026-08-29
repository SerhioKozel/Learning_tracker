// AdminView — hub for admin-only sections. Each section is a tile, matching
// the visual style of board cards (BoardsList.tsx), navigating to its own
// dedicated screen. Keeps AdminView itself simple as sections grow over time
// (Knowledge Library today; user management etc. later).

import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Library, Users, ChevronRight } from 'lucide-react';

interface AdminSection {
  to: string;
  title: string;
  description: string;
  icon: typeof Library;
  color: string;
  border: string;
  gradient: string;
  available: boolean;
}

const sections: AdminSection[] = [
  {
    to: '/admin/library',
    title: 'Knowledge Library',
    description: 'Manage the global topics users can add to their boards.',
    icon: Library,
    color: 'text-sky-300',
    border: 'border-sky-500/25',
    gradient: 'from-sky-500/10 to-transparent',
    available: true,
  },
  {
    to: '/admin/users',
    title: 'Users',
    description: 'Platform-wide statistics across all users.',
    icon: Users,
    color: 'text-ink-400',
    border: 'border-white/[0.08]',
    gradient: 'from-white/[0.02] to-transparent',
    available: false,
  },
];

export default function AdminView() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="animate-fade-up flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
          <ShieldCheck className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin panel</h1>
          <p className="text-sm text-ink-500">Platform-wide tools — visible to admins only.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.to}
              onClick={() => s.available && navigate(s.to)}
              disabled={!s.available}
              className={`group relative animate-fade-up overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.gradient} p-5 text-left transition-all duration-200 ${
                s.available ? 'hover:-translate-y-1 hover:shadow-lift' : 'cursor-not-allowed opacity-60'
              }`}
              style={{ animationDelay: `${100 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] ${s.border} border`}>
                  <Icon className={`h-5 w-5 ${s.color}`} strokeWidth={2} />
                </div>
                {s.available && (
                  <ChevronRight className="h-4 w-4 text-ink-500 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-xs text-ink-500">{s.description}</p>
              {!s.available && (
                <span className="mt-3 inline-block chip bg-ink-700/40 text-ink-500 border border-ink-600/40 text-[10px]">
                  Coming soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
