import { useState, useRef, useEffect } from 'react';
import {
  ExternalLink, Trash2, Plus, CheckSquare, Square,
  PlayCircle, BookOpen, BookMarked, Code2, Link2, FileText,
} from 'lucide-react';
import { resourceTypeConfig } from '../../config';
import type { Resource, Topic } from '../../types';

const resourceIcons: Record<string, typeof PlayCircle> = {
  Link2, BookOpen, PlayCircle, BookMarked, Code2,
};

interface TopicResourcesProps {
  topic: Topic;
  onToggle: (resourceId: string) => void;
  onDelete: (resourceId: string) => void;
  onAdd: (resource: { title: string; type: Resource['type']; url: string }) => void;
}

const EMPTY_FORM = { title: '', type: 'article' as Resource['type'], url: '' };

export default function TopicResources({ topic, onToggle, onDelete, onAdd }: TopicResourcesProps) {
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formVisible) titleRef.current?.focus();
  }, [formVisible]);

  function handleAdd() {
    if (!form.title.trim()) return;
    onAdd({ ...form, url: form.url.trim() || '#' });
    setForm(EMPTY_FORM);
    // Keep form open for rapid entry
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setFormVisible(false); setForm(EMPTY_FORM); }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">
          Resources
          {topic.resources.length > 0 && (
            <span className="ml-1.5 font-normal normal-case text-ink-700">
              {topic.resources.filter((r) => r.done).length}/{topic.resources.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setFormVisible((v) => !v)}
          className="flex items-center gap-1 rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.05] hover:text-ink-400"
          title="Add resource"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Resource list */}
      {topic.resources.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {topic.resources.map((r: Resource) => {
            const rc = resourceTypeConfig[r.type];
            const Icon = resourceIcons[rc.icon] ?? FileText;
            return (
              <div
                key={r.id}
                className="group flex items-center gap-2.5 rounded-xl border border-white/[0.05] bg-ink-800/60 px-3 py-2.5 transition-colors hover:border-white/[0.08]"
              >
                <button
                  onClick={() => onToggle(r.id)}
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {r.done
                    ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                    : <Square className="h-3.5 w-3.5 text-ink-700 transition-colors hover:text-ink-500" />
                  }
                </button>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-700">
                  <Icon className="h-3.5 w-3.5 text-ink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-xs font-medium ${r.done ? 'text-ink-600 line-through' : 'text-ink-200'}`}>
                    {r.title}
                  </div>
                  <div className="text-[10px] text-ink-600">{rc.label}</div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {r.url && r.url !== '#' && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-200"
                      title="Open link"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <button
                    onClick={() => onDelete(r.id)}
                    className="rounded-md p-1.5 text-ink-700 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                    title="Remove resource"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline add form */}
      {formVisible && (
        <div className="mt-2 space-y-2 rounded-xl border border-white/[0.06] bg-ink-800/60 p-3">
          <input
            ref={titleRef}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Resource title…"
            className="w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Resource['type'] })}
              className="appearance-none rounded-lg border border-white/[0.06] bg-ink-900 px-2.5 py-1.5 text-xs text-ink-100 focus:border-sky-500/30 focus:outline-none"
            >
              {Object.entries(resourceTypeConfig).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-ink-700">{cfg.label}</option>
              ))}
            </select>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="https://… (optional)"
              className="flex-1 rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!form.title.trim()}
              className="rounded-lg bg-sky-500/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Empty prompt */}
      {topic.resources.length === 0 && !formVisible && (
        <button
          onClick={() => setFormVisible(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white/[0.06] px-3 py-2 text-xs text-ink-600 transition-colors hover:border-white/[0.12] hover:text-ink-400"
        >
          <Plus className="h-3 w-3" /> Add resource…
        </button>
      )}
    </section>
  );
}
