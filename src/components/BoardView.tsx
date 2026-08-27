import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { Plus, ChevronLeft, X, Layout } from 'lucide-react';
import { statusConfig, boardColorMap, BOARD_ICONS, VISIBLE_STATUS_ORDER as COLUMN_ORDER } from '../config';
import ConfirmDialog from './ui/ConfirmDialog';
import DraggableCard from './board/DraggableCard';
import DroppableColumn from './board/DroppableColumn';
import CardContent from './board/CardContent';
import BoardFilters from './board/BoardFilters';
import type { Status, Difficulty, Topic, Board } from '../types';

interface BoardViewProps {
  boardId: string | null;
  boards: Board[];
  topics: Topic[];
  onSelectTopic: (id: string) => void;
  onBack: () => void;
  onCreateTopic: (data: { title: string; boardId: string; status?: Status }) => Promise<Topic | null>;
  onDeleteTopic: (id: string) => Promise<void>;
  onUpdateTopicStatus: (id: string, status: Status) => Promise<void>;
}

export default function BoardView({
  boardId, boards, topics, onSelectTopic, onBack,
  onCreateTopic, onDeleteTopic, onUpdateTopicStatus,
}: BoardViewProps) {
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | null>(null);
  const [newTopicCol, setNewTopicCol] = useState<Status | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<Status | null>(null);

  // Require 8px movement before drag starts — prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const board = boards.find((b) => b.id === boardId) ?? boards[0];

  const handleCreateInCol = useCallback(async () => {
    if (!newTopicTitle.trim() || !newTopicCol) return;
    await onCreateTopic({ title: newTopicTitle.trim(), boardId: board?.id ?? '', status: newTopicCol });
    setNewTopicTitle('');
    setNewTopicCol(null);
  }, [newTopicTitle, newTopicCol, onCreateTopic, board?.id]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    await onDeleteTopic(confirmDeleteId);
    setConfirmDeleteId(null);
  }, [confirmDeleteId, onDeleteTopic]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over?.id as Status | null;
    setOverColumn(COLUMN_ORDER.includes(over as Status) ? over : null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverColumn(null);
    if (!over) return;
    const newStatus = over.id as Status;
    if (!COLUMN_ORDER.includes(newStatus)) return;
    const topic = topics.find((t) => t.id === active.id);
    if (!topic || topic.status === newStatus) return;
    await onUpdateTopicStatus(topic.id, newStatus);
  }, [topics, onUpdateTopicStatus]);

  if (!board) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">No board selected</h1>
        <button onClick={onBack} className="btn-primary mt-4">Go to boards</button>
      </div>
    );
  }

  const c = boardColorMap[board.color] ?? boardColorMap.sky;
  const Icon = BOARD_ICONS[board.icon] ?? Layout;
  const boardTopics = topics.filter((t) => t.boardId === board.id);

  const filteredTopics = boardTopics.filter((t) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())
      && !t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))) return false;
    if (filterDifficulty && t.difficulty !== filterDifficulty) return false;
    return true;
  });

  const pct = board.topicCount > 0 ? Math.round((board.completedCount / board.topicCount) * 100) : 0;
  const topicToDelete = topics.find((t) => t.id === confirmDeleteId);
  const activeTopic = topics.find((t) => t.id === activeDragId) ?? null;


  return (
    <div className="flex h-full flex-col">
      {/* Board header */}
      <div className={`relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b ${c.gradient} px-8 py-6`}>
        <div className="relative flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className="mb-3 flex items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-100"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> All boards
            </button>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.border} border`}>
                <Icon className={`h-5 w-5 ${c.text}`} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-always-white">{board.title}</h1>
                <p className="mt-0.5 text-sm text-ink-500">{board.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-500">Progress</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-700">
              <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-always-white">{pct}%</span>
          </div>
          <span className="text-xs text-ink-500">
            {board.topicCount} topics · {board.completedCount} completed · updated {board.updatedAt}
          </span>
        </div>
      </div>

      {/* Search + filters bar — outside overflow-hidden so dropdown is never clipped */}
      <div className="flex items-center justify-end border-b border-white/[0.04] bg-ink-950/60 px-8 py-2.5">
        <BoardFilters
          query={query}
          filterDifficulty={filterDifficulty}
          filterOpen={filterOpen}
          onQueryChange={setQuery}
          onFilterOpenChange={setFilterOpen}
          onDifficultyChange={setFilterDifficulty}
          onClearAll={() => { setFilterDifficulty(null); }}
        />
      </div>

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-0 flex-1 overflow-x-auto px-8 py-6">
          <div className="flex h-full gap-4">
            {COLUMN_ORDER.map((status) => {
              const s = statusConfig[status];
              const colTopics = filteredTopics.filter((t) => t.status === status);
              return (
                <div key={status} className="flex w-80 shrink-0 flex-col">
                  {/* Column header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      <span className="text-sm font-semibold text-ink-100">{s.label}</span>
                      <span className="rounded-full bg-ink-700 px-1.5 py-0.5 text-[10px] tabular-nums text-ink-500">
                        {colTopics.length}
                      </span>
                    </div>
                    <button
                      onClick={() => { setNewTopicCol(status); setNewTopicTitle(''); }}
                      className="rounded-md p-1 text-ink-600 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Droppable area */}
                  <DroppableColumn status={status} isOver={overColumn === status}>
                    {colTopics.map((t) => (
                      <DraggableCard
                        key={t.id}
                        topic={t}
                        isDragging={activeDragId === t.id}
                        onClick={() => onSelectTopic(t.id)}
                        onDelete={() => setConfirmDeleteId(t.id)}
                      />
                    ))}

                    {colTopics.length === 0 && newTopicCol !== status && !activeDragId && (
                      <div className={`rounded-xl border border-dashed p-6 text-center transition-colors ${
                        overColumn === status ? 'border-sky-500/40' : 'border-white/[0.06]'
                      }`}>
                        <p className="text-xs text-ink-600">
                          {overColumn === status ? 'Drop here' : 'No topics here yet'}
                        </p>
                      </div>
                    )}

                    {/* Drop target hint when dragging over empty column */}
                    {activeDragId && overColumn === status && colTopics.length === 0 && (
                      <div className="rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 p-6 text-center">
                        <p className="text-xs text-sky-400">Drop here</p>
                      </div>
                    )}

                    {newTopicCol === status && (
                      <div className="animate-scale-in rounded-xl border border-sky-500/30 bg-sky-500/5 p-2.5">
                        <textarea
                          autoFocus
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreateInCol(); }
                            if (e.key === 'Escape') { setNewTopicCol(null); setNewTopicTitle(''); }
                          }}
                          placeholder="Topic title…"
                          rows={2}
                          className="w-full resize-none rounded-lg border border-white/[0.06] bg-ink-900 px-2.5 py-2 text-xs text-ink-100 placeholder:text-ink-600 focus:border-sky-500/40 focus:outline-none"
                        />
                        <div className="mt-2 flex justify-end gap-1.5">
                          <button
                            onClick={() => { setNewTopicCol(null); setNewTopicTitle(''); }}
                            className="rounded-md p-1 text-ink-600 hover:text-ink-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCreateInCol}
                            disabled={!newTopicTitle.trim()}
                            className="rounded-md bg-sky-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {status === 'to_learn' && newTopicCol !== status && (
                      <button
                        onClick={() => { setNewTopicCol(status); setNewTopicTitle(''); }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.06] py-2.5 text-xs text-ink-600 transition-colors hover:border-white/[0.1] hover:text-ink-400"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add topic
                      </button>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag overlay — renders the card being dragged */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTopic && (
            <div className="w-72 rotate-1 rounded-xl border border-sky-500/40 bg-ink-800 p-3.5 shadow-lift opacity-95">
              <CardContent topic={activeTopic} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {confirmDeleteId && topicToDelete && (
        <ConfirmDialog
          title="Delete topic?"
          message={`"${topicToDelete.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
