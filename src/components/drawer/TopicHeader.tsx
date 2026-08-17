import { X, Trash2, Copy } from 'lucide-react';
import { statusConfig, boardColorMap, STATUS_ORDER } from '../../config';
import type { Status, Topic, Board } from '../../types';

interface TopicHeaderProps {
  topic: Topic;
  board: Board | undefined;
  title: string;
  editingTitle: boolean;
  description: string;
  onTitleClick: () => void;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDescriptionChange: (value: string) => void;
  onDescriptionBlur: () => void;
  onStatusChange: (status: Status) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TopicHeader({
  topic, board,
  title, editingTitle, description,
  onTitleClick, onTitleChange, onTitleBlur, onTitleKeyDown,
  onDescriptionChange, onDescriptionBlur,
  onStatusChange, onDuplicate, onDelete, onClose,
}: TopicHeaderProps) {
  const boardColors = board ? boardColorMap[board.color] : boardColorMap.sky;
  const statusStyle = statusConfig[topic.status];

  return (
    <div className={`relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b ${boardColors.gradient} px-6 pb-5 pt-6`}>
      {/* Top row: badges + actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`chip ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
          <span className={`chip ${boardColors.bg} ${boardColors.text} border ${boardColors.border}`}>
            {board?.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
            title="Duplicate topic"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
            title="Delete topic"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editable title */}
      {editingTitle ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={onTitleKeyDown}
          className="mt-4 w-full bg-transparent text-xl font-bold leading-tight tracking-tight text-always-white focus:outline-none"
        />
      ) : (
        <h2
          className="group mt-4 cursor-text text-xl font-bold leading-tight tracking-tight text-always-white text-balance"
          onClick={onTitleClick}
          title="Click to edit title"
        >
          {topic.title}
          <span className="ml-2 inline-block text-sm font-normal text-ink-600 opacity-0 transition-opacity group-hover:opacity-100">
            ✎
          </span>
        </h2>
      )}

      {/* Editable description */}
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        onBlur={onDescriptionBlur}
        placeholder="Add a description…"
        rows={2}
        className="mt-1.5 w-full resize-none bg-transparent text-sm leading-relaxed text-ink-400 placeholder:text-ink-600 focus:text-ink-100 focus:outline-none"
      />

      {/* Status pills */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {STATUS_ORDER.map((st) => {
          const cfg = statusConfig[st];
          const active = topic.status === st;
          return (
            <button
              key={st}
              onClick={() => onStatusChange(st)}
              className={`chip border transition-all ${
                active
                  ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                  : 'border-white/[0.06] text-ink-600 hover:text-ink-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
