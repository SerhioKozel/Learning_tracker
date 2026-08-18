import {
  CheckSquare, Square, ExternalLink, Trash2,
  PlayCircle, FileText, BookOpen, BookMarked, Code2, Link2,
} from 'lucide-react';
import { resourceTypeConfig } from '../../config';
import type { Resource, Topic } from '../../types';

const resourceIcons: Record<string, typeof PlayCircle> = {
  Link2, BookOpen, PlayCircle, BookMarked, Code2,
};

interface NewResourceState {
  title: string;
  type: Resource['type'];
  url: string;
}

interface TopicResourcesProps {
  topic: Topic;
  newResource: NewResourceState;
  onNewResourceChange: (value: NewResourceState) => void;
  onToggle: (resourceId: string) => void;
  onDelete: (resourceId: string) => void;
  onAdd: () => void;
}

export default function TopicResources({
  topic, newResource,
  onNewResourceChange, onToggle, onDelete, onAdd,
}: TopicResourcesProps) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Link2 className="h-4 w-4 text-ink-500" /> Resources
        <span className="text-xs font-normal text-ink-600">({topic.resources.length})</span>
      </h3>

      <div className="mt-3 space-y-2">
        {topic.resources.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.06] p-4 text-center">
            <p className="text-xs text-ink-600">No resources linked yet</p>
          </div>
        )}
        {topic.resources.map((r: Resource) => {
          const rc = resourceTypeConfig[r.type];
          const Icon = resourceIcons[rc.icon] ?? FileText;
          return (
            <div
              key={r.id}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-ink-800 p-3 transition-colors hover:border-white/[0.08]"
            >
              <button onClick={() => onToggle(r.id)} className="shrink-0">
                {r.done
                  ? <CheckSquare className="h-4 w-4 text-emerald-400" />
                  : <Square className="h-4 w-4 text-ink-700 transition-colors hover:text-ink-500" />
                }
              </button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-700">
                <Icon className="h-4 w-4 text-ink-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${r.done ? 'text-ink-600 line-through' : 'text-ink-100'}`}>
                  {r.title}
                </div>
                <div className="text-xs text-ink-600">{rc.label}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {r.url && r.url !== '#' && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1.5 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => onDelete(r.id)}
                  className="rounded-md p-1.5 text-ink-700 transition-colors hover:bg-rose-500/15 hover:text-rose-400"
                  title="Remove resource"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      <div className="mt-3 space-y-2 rounded-xl border border-white/[0.05] bg-ink-800/60 p-3">
        <input
          value={newResource.title}
          onChange={(e) => onNewResourceChange({ ...newResource, title: e.target.value })}
          placeholder="Resource title…"
          className="w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={newResource.type}
            onChange={(e) => onNewResourceChange({ ...newResource, type: e.target.value as Resource['type'] })}
            className="appearance-none rounded-lg border border-white/[0.06] bg-ink-900 px-2.5 py-2 text-xs text-ink-100 focus:border-sky-500/30 focus:outline-none"
          >
            {Object.entries(resourceTypeConfig).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-ink-700">{cfg.label}</option>
            ))}
          </select>
          <input
            value={newResource.url}
            onChange={(e) => onNewResourceChange({ ...newResource, url: e.target.value })}
            placeholder="https://…"
            className="flex-1 rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/30 focus:outline-none"
          />
          <button
            onClick={onAdd}
            disabled={!newResource.title.trim()}
            className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}
