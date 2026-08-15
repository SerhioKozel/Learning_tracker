import { useDroppable } from '@dnd-kit/core';
import type { Status } from '../../types';

interface DroppableColumnProps {
  status: Status;
  isOver: boolean;
  children: React.ReactNode;
}

export default function DroppableColumn({ status, isOver, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl pb-4 transition-colors duration-150 ${
        isOver ? 'bg-sky-500/5 ring-1 ring-sky-500/20' : ''
      }`}
    >
      {children}
    </div>
  );
}
