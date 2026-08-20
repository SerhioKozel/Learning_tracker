import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Trash2 } from 'lucide-react';
import CardContent from './CardContent';
import type { Topic } from '../../types';

interface DraggableCardProps {
  topic: Topic;
  isDragging?: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function DraggableCard({ topic, isDragging, onClick, onDelete }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isActiveDrag } = useDraggable({ id: topic.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative w-full rounded-xl border bg-ink-800 ${
        isActiveDrag || isDragging
          ? 'cursor-grabbing border-sky-500/40 opacity-40 shadow-none'
          : 'cursor-grab border-white/[0.06] hover:-translate-y-0.5 hover:border-white/[0.1] hover:shadow-lift'
      }`}
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-700 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Card body — opens drawer */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="block w-full p-3.5 pl-5 text-left"
      >
        <CardContent topic={topic} />
      </button>

      {/* Delete row — visible on hover, below card content, never overlaps badges */}
      <div className="flex items-center justify-end border-t border-white/[0.04] px-3 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-600 transition-all hover:bg-rose-500/15 hover:text-rose-300"
          title="Delete topic"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
