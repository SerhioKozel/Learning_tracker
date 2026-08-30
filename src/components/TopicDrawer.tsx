import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import ConfirmDialog from './ui/ConfirmDialog';
import TopicHeader from './drawer/TopicHeader';
import TopicProperties from './drawer/TopicProperties';
import TopicChecklist from './drawer/TopicChecklist';
import TopicResources from './drawer/TopicResources';
import TopicNotes from './drawer/TopicNotes';
import TopicHistory from './drawer/TopicHistory';
import { computeStatusChange } from '../utils/status';
import type { Status, Difficulty, Resource, HistoryEntry, Topic, Board } from '../types';

interface TopicDrawerProps {
  topic: Topic | null;
  boards: Board[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<{
    title: string; description: string; status: Status;
    difficulty: Difficulty; tags: string[];
    deadlineDate: string | null; checklist: Topic['checklist'];
    resources: Resource[]; notes: string; history: HistoryEntry[];
  }>, currentTopic?: Topic) => Promise<void>;
  onAddChecklistItem: (topicId: string, text: string) => Promise<void>;
  onDeleteChecklistItem: (topicId: string, itemId: string) => Promise<void>;
  onToggleChecklistItem: (topicId: string, itemId: string) => Promise<void>;
  onAddResource: (topicId: string, data: { title: string; type: Resource['type']; url: string }) => Promise<void>;
  onDeleteResource: (topicId: string, resourceId: string) => Promise<void>;
  onToggleResource: (topicId: string, resourceId: string) => Promise<void>;
  onDuplicateTopic: (id: string) => Promise<Topic | null>;
  onDeleteTopic: (id: string) => Promise<void>;
}

export default function TopicDrawer({
  topic, boards, onClose, onUpdate,
  onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem,
  onAddResource, onDeleteResource, onToggleResource,
  onDuplicateTopic, onDeleteTopic,
}: TopicDrawerProps) {
  const [title, setTitle] = useState(topic?.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState(topic?.description ?? '');
  const [notes, setNotes] = useState(topic?.notes ?? '');
  const [newTag, setNewTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local fields when a different topic is opened
  const prevTopicId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (topic?.id !== prevTopicId.current) {
      setTitle(topic?.title ?? '');
      setEditingTitle(false);
      setDescription(topic?.description ?? '');
      setNotes(topic?.notes ?? '');
      setNewTag('');
      prevTopicId.current = topic?.id;
    }
  }, [topic?.id, topic?.title, topic?.description, topic?.notes]);

  if (!topic) return null;

  const board = boards.find((b) => b.id === topic.boardId);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = (newStatus: Status) => {
    const { historyEntry } = computeStatusChange(topic, newStatus);
    onUpdate(topic.id, {
      status: newStatus,
      history: [...topic.history, historyEntry],
    });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== topic.title) {
      onUpdate(topic.id, { title: trimmed }, topic);
    } else {
      setTitle(topic.title);
    }
  };

  const handleConfirmDelete = async () => {
    await onDeleteTopic(topic.id);
    onClose();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="overlay fixed inset-0 z-40 animate-fade-in backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg animate-slide-in-right flex-col border-l border-white/[0.08] bg-ink-950 shadow-2xl">

        <TopicHeader
          topic={topic}
          board={board}
          title={title}
          editingTitle={editingTitle}
          description={description}
          onTitleClick={() => setEditingTitle(true)}
          onTitleChange={setTitle}
          onTitleBlur={handleTitleBlur}
          onTitleKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { setTitle(topic.title); setEditingTitle(false); }
          }}
          onDescriptionChange={setDescription}
          onDescriptionBlur={() => {
            if (description !== topic.description) onUpdate(topic.id, { description }, topic);
          }}
          onStatusChange={handleStatusChange}
          onDuplicate={() => onDuplicateTopic(topic.id).then(onClose)}
          onDelete={() => setConfirmDelete(true)}
          onClose={onClose}
        />

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">

            <TopicProperties
              topic={topic}
              board={board}
              newTag={newTag}
              onDifficultyChange={(difficulty) => onUpdate(topic.id, { difficulty }, topic)}
              onDeadlineDateChange={(value) => onUpdate(topic.id, { deadlineDate: value || null }, topic)}
              onNewTagChange={setNewTag}
              onAddTag={() => {
                const tag = newTag.trim().toLowerCase();
                if (!tag || topic.tags.includes(tag)) return;
                onUpdate(topic.id, { tags: [...topic.tags, tag] }, topic);
                setNewTag('');
              }}
              onRemoveTag={(tag) => onUpdate(topic.id, { tags: topic.tags.filter((t) => t !== tag) }, topic)}
            />

            <div className="border-t border-white/[0.04]" />

            <TopicChecklist
              topic={topic}
              onToggle={(itemId) => onToggleChecklistItem(topic.id, itemId)}
              onDelete={(itemId) => onDeleteChecklistItem(topic.id, itemId)}
              onAdd={(text) => onAddChecklistItem(topic.id, text)}
            />

            <div className="border-t border-white/[0.04]" />

            <TopicResources
              topic={topic}
              onToggle={(resourceId) => onToggleResource(topic.id, resourceId)}
              onDelete={(resourceId) => onDeleteResource(topic.id, resourceId)}
              onAdd={(data) => onAddResource(topic.id, data)}
            />

            <div className="border-t border-white/[0.04]" />

            <TopicNotes
              notes={notes}
              onChange={setNotes}
              onBlur={() => {
                if (notes !== topic.notes) onUpdate(topic.id, { notes });
              }}
            />

            <div className="border-t border-white/[0.04]" />

            <TopicHistory history={topic.history} />

            <div className="flex items-center gap-4 text-xs text-ink-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Created {topic.createdAt}
              </span>
              <span>Updated {topic.updatedAt}</span>
            </div>

          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete topic?"
          message={`"${topic.title}" will be permanently deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
