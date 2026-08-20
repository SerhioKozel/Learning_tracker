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
import type { Status, TopicType, Difficulty, Resource, HistoryEntry, Topic, Board } from '../types';

interface TopicDrawerProps {
  topic: Topic | null;
  boards: Board[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<{
    title: string; description: string; status: Status; type: TopicType;
    difficulty: Difficulty; progress: number; tags: string[];
    deadlineDate: string | null; checklist: Topic['checklist'];
    resources: Resource[]; notes: string; history: HistoryEntry[];
  }>) => Promise<void>;
  onAddChecklistItem: (topicId: string, text: string) => Promise<void>;
  onDeleteChecklistItem: (topicId: string, itemId: string) => Promise<void>;
  onToggleChecklistItem: (topicId: string, itemId: string) => Promise<void>;
  onAddResource: (topicId: string, data: { title: string; type: Resource['type']; url: string }) => Promise<void>;
  onDeleteResource: (topicId: string, resourceId: string) => Promise<void>;
  onToggleResource: (topicId: string, resourceId: string) => Promise<void>;
  onDuplicateTopic: (id: string) => Promise<Topic | null>;
  onDeleteTopic: (id: string) => Promise<void>;
}

const DIVIDER = <div className="my-6 border-t border-white/[0.04]" />;

export default function TopicDrawer({
  topic, boards, onClose, onUpdate,
  onAddChecklistItem, onDeleteChecklistItem, onToggleChecklistItem,
  onAddResource, onDeleteResource, onToggleResource,
  onDuplicateTopic, onDeleteTopic,
}: TopicDrawerProps) {
  // ─── Local state ────────────────────────────────────────────────────────────

  const [title, setTitle] = useState(topic?.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState(topic?.description ?? '');
  const [notes, setNotes] = useState(topic?.notes ?? '');
  const [localProgress, setLocalProgress] = useState(topic?.progress ?? 0);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newResource, setNewResource] = useState<{ title: string; type: Resource['type']; url: string }>(
    { title: '', type: 'url', url: '' },
  );
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
      setLocalProgress(topic?.progress ?? 0);
      setNewChecklistText('');
      setNewResource({ title: '', type: 'url', url: '' });
      setNewTag('');
      prevTopicId.current = topic?.id;
    }
  }, [topic?.id, topic?.title, topic?.description, topic?.notes, topic?.progress]);

  if (!topic) return null;

  const board = boards.find((b) => b.id === topic.boardId);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStatusChange = (newStatus: Status) => {
    const { progress, historyEntry } = computeStatusChange(topic, newStatus);
    onUpdate(topic.id, {
      status: newStatus,
      progress,
      history: [...topic.history, historyEntry],
    });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== topic.title) {
      onUpdate(topic.id, { title: trimmed });
    } else {
      setTitle(topic.title);
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistText.trim()) return;
    await onAddChecklistItem(topic.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddResource = async () => {
    if (!newResource.title.trim()) return;
    await onAddResource(topic.id, newResource);
    setNewResource({ title: '', type: 'url', url: '' });
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
            if (description !== topic.description) onUpdate(topic.id, { description });
          }}
          onStatusChange={handleStatusChange}
          onDuplicate={() => onDuplicateTopic(topic.id).then(onClose)}
          onDelete={() => setConfirmDelete(true)}
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

          <TopicProperties
            topic={topic}
            board={board}
            localProgress={localProgress}
            newTag={newTag}
            onTypeChange={(type) => onUpdate(topic.id, { type })}
            onDifficultyChange={(difficulty) => onUpdate(topic.id, { difficulty })}
            onProgressChange={setLocalProgress}
            onProgressCommit={(value) => onUpdate(topic.id, { progress: value })}
            onDeadlineDateChange={(value) => onUpdate(topic.id, { deadlineDate: value || null })}
            onNewTagChange={setNewTag}
            onAddTag={() => {
              const tag = newTag.trim().toLowerCase();
              if (!tag || topic.tags.includes(tag)) return;
              onUpdate(topic.id, { tags: [...topic.tags, tag] });
              setNewTag('');
            }}
            onRemoveTag={(tag) => onUpdate(topic.id, { tags: topic.tags.filter((t) => t !== tag) })}
          />

          {DIVIDER}

          {/* Checklist — hidden in MVP UI, code preserved for future use */}
          <div className="hidden">
            <TopicChecklist
              topic={topic}
              newChecklistText={newChecklistText}
              onNewTextChange={setNewChecklistText}
              onToggle={(itemId) => onToggleChecklistItem(topic.id, itemId)}
              onDelete={(itemId) => onDeleteChecklistItem(topic.id, itemId)}
              onAdd={handleAddChecklist}
            />
          </div>

          {/* Resources — hidden in MVP UI, code preserved for future use */}
          <div className="hidden">
            <TopicResources
              topic={topic}
              newResource={newResource}
              onNewResourceChange={setNewResource}
              onToggle={(resourceId) => onToggleResource(topic.id, resourceId)}
              onDelete={(resourceId) => onDeleteResource(topic.id, resourceId)}
              onAdd={handleAddResource}
            />
          </div>

          <TopicNotes
            notes={notes}
            onChange={setNotes}
            onBlur={() => {
              if (notes !== topic.notes) onUpdate(topic.id, { notes });
            }}
          />

          {DIVIDER}

          <TopicHistory history={topic.history} />

          {DIVIDER}

          <div className="flex items-center gap-4 text-xs text-ink-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Created {topic.createdAt}
            </span>
            <span>Updated {topic.updatedAt}</span>
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
