import { useState, useRef, useEffect } from 'react';
import {
  ExternalLink, Trash2, Plus, CheckSquare, Square,
  Code2, Link2, BookMarked, ChevronDown,
} from 'lucide-react';
import { resourceTypeConfig } from '../../config';
import type { Resource, Topic } from '../../types';

const resourceIcons: Record<string, typeof Plus> = { BookMarked, Code2, Link2 };

const CATEGORIES: Resource['type'][] = ['documentation', 'snippet', 'other'];

// Visual accent per category: border color, icon color, header bg
const CATEGORY_STYLE: Record<Resource['type'], {
  headerBg: string;
  iconColor: string;
  accentBorder: string;
  titlePlaceholder: string;
  urlPlaceholder: string;
}> = {
  documentation: {
    headerBg:        'bg-sky-500/[0.07]',
    iconColor:       'text-sky-400',
    accentBorder:    'border-sky-500/20',
    titlePlaceholder:'e.g. Java Concurrency in Practice',
    urlPlaceholder:  'https://docs.example.com/…',
  },
  snippet: {
    headerBg:        'bg-violet-500/[0.07]',
    iconColor:       'text-violet-400',
    accentBorder:    'border-violet-500/20',
    titlePlaceholder:'e.g. ThreadPoolExecutor example',
    urlPlaceholder:  'https://github.com/… or gist',
  },
  other: {
    headerBg:        'bg-ink-700/40',
    iconColor:       'text-ink-500',
    accentBorder:    'border-white/[0.05]',
    titlePlaceholder:'e.g. Concurrency video tutorial',
    urlPlaceholder:  'https://…',
  },
};

interface TopicResourcesProps {
  topic: Topic;
  onToggle: (resourceId: string) => void;
  onDelete: (resourceId: string) => void;
  onAdd: (resource: { title: string; type: Resource['type']; url: string }) => void;
}

interface FormState { title: string; url: string; }
const EMPTY: FormState = { title: '', url: '' };

function CategorySection({
  type, resources, onToggle, onDelete, onAdd,
}: {
  type: Resource['type'];
  resources: Resource[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string, url: string) => void;
}) {
  const cfg   = resourceTypeConfig[type];
  const style = CATEGORY_STYLE[type];
  const Icon  = resourceIcons[cfg.icon] ?? Link2;

  const [formVisible,    setFormVisible]    = useState(false);
  const [listCollapsed,  setListCollapsed]  = useState(false);
  const [form,           setForm]           = useState<FormState>(EMPTY);
  const titleRef  = useRef<HTMLInputElement>(null);
  const skipBlur  = useRef(false);

  useEffect(() => {
    if (formVisible) titleRef.current?.focus();
  }, [formVisible]);

  function handleAdd() {
    if (!form.title.trim()) return;
    onAdd(form.title.trim(), form.url.trim() || '#');
    setForm(EMPTY);
    titleRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setFormVisible(false); setForm(EMPTY); }
  }

  function handleTitleBlur() {
    if (skipBlur.current) { skipBlur.current = false; return; }
    if (!form.title.trim()) { setFormVisible(false); setForm(EMPTY); }
  }

  const doneCount = resources.filter((r) => r.done).length;

  return (
    <div className={`overflow-hidden rounded-xl border ${style.accentBorder}`}>

      {/* ── Header ── */}
      <div className={`flex items-center gap-2 px-3 py-2 ${style.headerBg}`}>
        <button
          onClick={() => resources.length > 0 && setListCollapsed((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <Icon className={`h-3.5 w-3.5 shrink-0 ${style.iconColor}`} />
          <span className="flex-1 text-xs font-medium text-ink-300">{cfg.label}</span>
          {resources.length > 0 && (
            <span className="text-[10px] text-ink-600">{doneCount}/{resources.length}</span>
          )}
          {resources.length > 0 && (
            <ChevronDown
              className={`h-3 w-3 text-ink-600 transition-transform ${listCollapsed ? '-rotate-90' : ''}`}
            />
          )}
        </button>
        <button
          onPointerDown={() => { skipBlur.current = true; }}
          onClick={() => { setFormVisible((v) => !v); setListCollapsed(false); }}
          className="rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-300"
          title={`Add to ${cfg.label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Resource list ── */}
      {!listCollapsed && resources.length > 0 && (
        <div className="divide-y divide-white/[0.03] bg-ink-800/20">
          {resources.map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-white/[0.03]"
            >
              <button onClick={() => onToggle(r.id)} className="shrink-0 transition-transform active:scale-90">
                {r.done
                  ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                  : <Square className={`h-3.5 w-3.5 text-ink-700 transition-colors group-hover:${style.iconColor}`} />
                }
              </button>
              <span className={`flex-1 truncate text-xs ${r.done ? 'text-ink-600 line-through' : 'text-ink-200'}`}>
                {r.title}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {r.url && r.url !== '#' && (
                  <a
                    href={r.url} target="_blank" rel="noopener noreferrer"
                    className="rounded p-1 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-200"
                    title="Open"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  onPointerDown={(e) => { e.preventDefault(); onDelete(r.id); }}
                  className="rounded p-1 text-ink-700 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty hint ── */}
      {!formVisible && resources.length === 0 && (
        <button
          onClick={() => setFormVisible(true)}
          className="w-full bg-ink-800/20 px-3 py-2 text-left"
        >
          <p className="text-[10px] text-ink-700 transition-colors hover:text-ink-500">
            {cfg.description} ·{' '}
            <span className={`${style.iconColor} opacity-70`}>Add one…</span>
          </p>
        </button>
      )}

      {/* ── Inline form ── */}
      {formVisible && (
        <div className="space-y-2 border-t border-white/[0.04] bg-ink-800/30 p-2.5">
          <input
            ref={titleRef}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={handleKeyDown}
            onBlur={handleTitleBlur}
            placeholder={style.titlePlaceholder}
            className="w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder={style.urlPlaceholder}
              className="flex-1 rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
            />
            <button
              onPointerDown={() => { skipBlur.current = true; }}
              onClick={handleAdd}
              disabled={!form.title.trim()}
              className="rounded-lg bg-sky-500/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopicResources({ topic, onToggle, onDelete, onAdd }: TopicResourcesProps) {
  const totalDone = topic.resources.filter((r) => r.done).length;
  const total     = topic.resources.length;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">
          Resources
          {total > 0 && (
            <span className="ml-1.5 font-normal normal-case text-ink-700">{totalDone}/{total}</span>
          )}
        </h3>
      </div>
      <div className="mt-2 space-y-1.5">
        {CATEGORIES.map((type) => (
          <CategorySection
            key={type}
            type={type}
            resources={topic.resources.filter((r) => r.type === type)}
            onToggle={onToggle}
            onDelete={onDelete}
            onAdd={(title, url) => onAdd({ title, type, url })}
          />
        ))}
      </div>
    </section>
  );
}
