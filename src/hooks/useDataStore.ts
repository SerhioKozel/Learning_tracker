import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../utils/date';
import { generateId } from '../utils/id';
import { computeStatusChange, computeFieldUpdates } from '../utils/status';
import type {
  Board,
  Topic,
  Status,
  Difficulty,
  ChecklistItem,
  Resource,
  HistoryEntry,
  LibraryTopic,
} from '../types';

// ─── Raw Supabase row shapes ──────────────────────────────────────────────────

interface RawBoard {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface RawTopic {
  id: string;
  title: string;
  description: string;
  status: string;
  board_id: string;
  difficulty: string;
  review_date: string | null;
  deadline_date: string | null;
  checklist: ChecklistItem[] | null;
  resources: Resource[] | null;
  notes: string | null;
  history: HistoryEntry[] | null;
  library_topic_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Mapping functions ────────────────────────────────────────────────────────

function mapBoard(raw: RawBoard, topics: RawTopic[]): Board {
  const boardTopics = topics.filter((t) => t.board_id === raw.id);
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    color: raw.color as Board['color'],
    icon: raw.icon,
    topicCount: boardTopics.length,
    completedCount: boardTopics.filter((t) => t.status === 'completed').length,
    updatedAt: timeAgo(raw.updated_at),
    updatedAtRaw: raw.updated_at,
    createdAt: raw.created_at.slice(0, 10),
  };
}

function mapTopic(raw: RawTopic, tagNames: string[] = []): Topic {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status as Status,
    boardId: raw.board_id,
    difficulty: raw.difficulty as Difficulty,
    tags: tagNames,
    reviewDate: raw.review_date,       // preserved for data compatibility, not used in UI
    deadlineDate: raw.deadline_date,
    checklist: raw.checklist ?? [],
    resources: raw.resources ?? [],
    notes: raw.notes ?? '',
    history: raw.history ?? [],
    libraryTopicId: raw.library_topic_id,
    updatedAt: timeAgo(raw.updated_at),
    updatedAtRaw: raw.updated_at,
    createdAt: raw.created_at.slice(0, 10),
  };
}

type TopicTagRow = {
  topic_id: string;
  tags: { name: string } | { name: string }[] | null;
};

function getTagNames(tags: TopicTagRow['tags']): string[] {
  if (!tags) return [];
  return Array.isArray(tags) ? tags.map((tag) => tag.name) : [tags.name];
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

/** Converts a tag name to a URL-safe slug: "CI/CD" → "ci-cd", "Test Design" → "test-design" */
function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Ensures all tag names exist in the `tags` table (upsert by slug).
 * Returns a map of { name → id } for the given names.
 */
async function upsertTags(
  supabaseClient: typeof supabase,
  names: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (names.length === 0) return result;

  const rows = names.map((name) => ({
    name: name.trim(),
    slug: toSlug(name),
    color: '#6b7280',   // default neutral color for user-created tags
    type: 'custom' as const,
  }));

  const { data, error } = await supabaseClient
    .from('tags')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, name');

  if (error || !data) return result;
  data.forEach((t: { id: string; name: string }) => result.set(t.name, t.id));
  return result;
}

/**
 * Replaces all topic_tags for a topic with the given tag names.
 * Upserts tags as needed, then replaces junction rows atomically.
 */
async function syncTopicTags(
  supabaseClient: typeof supabase,
  topicId: string,
  tagNames: string[],
): Promise<void> {
  // Delete existing associations
  await supabaseClient.from('topic_tags').delete().eq('topic_id', topicId);

  if (tagNames.length === 0) return;

  const nameToId = await upsertTags(supabaseClient, tagNames);
  const rows = tagNames
    .filter((name) => nameToId.has(name))
    .map((name) => ({ topic_id: topicId, tag_id: nameToId.get(name)! }));

  if (rows.length > 0) {
    await supabaseClient.from('topic_tags').insert(rows);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDataStore() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [topicsResult, boardsResult, topicTagsResult] = await Promise.all([
      supabase.from('topics').select('*').order('updated_at', { ascending: false }),
      supabase.from('boards').select('*').order('updated_at', { ascending: false }),
      supabase.from('topic_tags').select('topic_id, tags(name)'),
    ]);

    if (topicsResult.error || boardsResult.error) {
      setError(topicsResult.error?.message ?? boardsResult.error?.message ?? 'Failed to load data');
      setLoading(false);
      return;
    }

    const rawTopics = (topicsResult.data as RawTopic[]) ?? [];
    const rawBoards = (boardsResult.data as RawBoard[]) ?? [];

    // Build topic_id → tag names map from the join result
    const tagsByTopic = new Map<string, string[]>();
    const topicTagRows = (topicTagsResult.data ?? []) as TopicTagRow[];
    topicTagRows.forEach((row) => {
      const names = tagsByTopic.get(row.topic_id) ?? [];
      names.push(...getTagNames(row.tags));
      tagsByTopic.set(row.topic_id, names);
    });

    setTopics(rawTopics.map((raw) => mapTopic(raw, tagsByTopic.get(raw.id) ?? [])));
    setBoards(rawBoards.map((b) => mapBoard(b, rawTopics)));
    setLoading(false);
  }, []);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Supabase Realtime subscription ────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boards' },
        () => { fetchAll(); },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        () => { fetchAll(); },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('disconnected');
        else setRealtimeStatus('connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ─── Board mutations ────────────────────────────────────────────────────────

  const createBoard = useCallback(async (data: {
    title: string;
    description: string;
    color: Board['color'];
    icon: string;
  }): Promise<Board | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return null; }

    const { data: row, error: err } = await supabase
      .from('boards')
      .insert({ title: data.title, description: data.description, color: data.color, icon: data.icon, user_id: user.id })
      .select('*')
      .maybeSingle();

    if (err || !row) { setError(err?.message ?? 'Failed to create board'); return null; }
    await fetchAll();
    return mapBoard(row as RawBoard, []);
  }, [fetchAll]);

  const updateBoard = useCallback(async (
    id: string,
    data: Partial<Pick<Board, 'title' | 'description' | 'color' | 'icon'>>,
  ): Promise<void> => {
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.color !== undefined) updates.color = data.color;
    if (data.icon !== undefined) updates.icon = data.icon;

    const { error: err } = await supabase.from('boards').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }
    await fetchAll();
  }, [fetchAll]);

  const deleteBoard = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('boards').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    await fetchAll();
  }, [fetchAll]);

  const duplicateBoard = useCallback(async (id: string): Promise<void> => {
    const { data: board } = await supabase.from('boards').select('*').eq('id', id).maybeSingle();
    if (!board) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return; }

    const { data: newBoard, error: boardErr } = await supabase
      .from('boards')
      .insert({ title: `${board.title} (copy)`, description: board.description, color: board.color, icon: board.icon, user_id: user.id })
      .select('*')
      .maybeSingle();

    if (boardErr || !newBoard) { setError(boardErr?.message ?? 'Failed to duplicate board'); return; }

    const { data: boardTopics } = await supabase.from('topics').select('*').eq('board_id', id);
    if (boardTopics && boardTopics.length > 0) {
      const newTopics = boardTopics.map((t) => ({
        title: t.title, description: t.description, status: t.status,
        board_id: newBoard.id, difficulty: t.difficulty,
        review_date: t.review_date,
        deadline_date: t.deadline_date,
        checklist: t.checklist, resources: t.resources, notes: t.notes, history: t.history,
        user_id: user.id,
      }));
      const { data: insertedTopics } = await supabase.from('topics').insert(newTopics).select('id');

      // Copy topic_tags for each duplicated topic
      if (insertedTopics && insertedTopics.length > 0) {
        const { data: sourceTags } = await supabase
          .from('topic_tags')
          .select('topic_id, tags(name)')
          .in('topic_id', boardTopics.map((t) => t.id));

        if (sourceTags && sourceTags.length > 0) {
          // Map old topic id → new topic id by position
          const idMap = new Map(boardTopics.map((t, i) => [t.id, insertedTopics[i]?.id]));

          await Promise.all(
            insertedTopics.map((newTopic, i) => {
              const oldId = boardTopics[i]?.id;
              const tagNames = (sourceTags as TopicTagRow[])
                .filter((r) => r.topic_id === oldId)
                .flatMap((r) => getTagNames(r.tags));
              return tagNames.length > 0
                ? syncTopicTags(supabase, newTopic.id, tagNames)
                : Promise.resolve();
            }),
          );

          void idMap; // referenced above, suppress unused warning
        }
      }
    }
    await fetchAll();
  }, [fetchAll]);

  // ─── Topic mutations ────────────────────────────────────────────────────────

  const createTopic = useCallback(async (data: {
    title: string;
    boardId: string;
    status?: Status;
  }): Promise<Topic | null> => {
    const now = new Date().toISOString();
    const history: HistoryEntry[] = [{ id: generateId('h'), action: 'created', detail: 'Topic created', date: now }];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return null; }

    const { data: row, error: err } = await supabase
      .from('topics')
      .insert({
        title: data.title, description: '', status: data.status ?? 'to_learn',
        board_id: data.boardId, difficulty: 'medium',
        review_date: null, deadline_date: null,
        checklist: [], resources: [],
        notes: '', history, created_at: now, updated_at: now,
        user_id: user.id,
      })
      .select('*')
      .maybeSingle();

    if (err || !row) { setError(err?.message ?? 'Failed to create topic'); return null; }
    await fetchAll();
    return mapTopic(row as RawTopic);
  }, [fetchAll]);

  const updateTopic = useCallback(async (
    id: string,
    data: Partial<{
      title: string; description: string; status: Status;
      difficulty: Difficulty; tags: string[];
      deadlineDate: string | null; checklist: ChecklistItem[];
      resources: Resource[]; notes: string; history: HistoryEntry[];
    }>,
    currentTopic?: Topic,
  ): Promise<void> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
    if (data.deadlineDate !== undefined) updates.deadline_date = data.deadlineDate;
    if (data.checklist !== undefined) updates.checklist = data.checklist;
    if (data.resources !== undefined) updates.resources = data.resources;
    if (data.notes !== undefined) updates.notes = data.notes;

    // Auto-generate 'updated' history entries for tracked fields when currentTopic is provided
    let newHistory = data.history;
    if (currentTopic) {
      const fieldEntries = computeFieldUpdates(currentTopic, {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        deadlineDate: data.deadlineDate,
        tags: data.tags,
      });
      if (fieldEntries.length > 0) {
        newHistory = [...currentTopic.history, ...(data.history ?? []), ...fieldEntries];
      }
    }

    // Cap history at 50 entries to prevent unbounded JSONB growth (BL-001)
    if (newHistory !== undefined) updates.history = newHistory.slice(-50);

    const { error: err } = await supabase.from('topics').update(updates).eq('id', id);
    if (err) { setError(err?.message ?? 'Failed to update topic'); return; }

    // Tags are stored in topic_tags, not in the topics row
    if (data.tags !== undefined) {
      await syncTopicTags(supabase, id, data.tags);
    }

    await fetchAll();
  }, [fetchAll]);

  const duplicateTopic = useCallback(async (id: string): Promise<Topic | null> => {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return null;
    const now = new Date().toISOString();
    const history: HistoryEntry[] = [{ id: generateId('h'), action: 'created', detail: 'Duplicated from topic', date: now }];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return null; }

    const { data: row, error: err } = await supabase
      .from('topics')
      .insert({
        title: `${topic.title} (copy)`,
        description: topic.description,
        status: 'to_learn',
        board_id: topic.boardId,
        difficulty: topic.difficulty,
        review_date: null,
        deadline_date: null,
        checklist: topic.checklist.map((c) => ({ ...c, done: false })),
        resources: topic.resources.map((r) => ({ ...r, done: false })),
        notes: topic.notes,
        history,
        created_at: now,
        updated_at: now,
        user_id: user.id,
      })
      .select('*')
      .maybeSingle();
    if (err || !row) { setError(err?.message ?? 'Failed to duplicate topic'); return null; }

    // Copy tags to the new topic via topic_tags
    if (topic.tags.length > 0) {
      await syncTopicTags(supabase, (row as RawTopic).id, topic.tags);
    }

    await fetchAll();
    return mapTopic(row as RawTopic, topic.tags);
  }, [topics, fetchAll]);

  /**
   * Copies a Knowledge Library topic into the user's own topics, attached to
   * the given board. The copy is fully independent — editing it afterwards
   * never touches the library source (DL-018).
   */
  const addTopicFromLibrary = useCallback(async (
    libraryTopic: LibraryTopic,
    boardId: string,
  ): Promise<Topic | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return null; }

    const now = new Date().toISOString();
    const history: HistoryEntry[] = [{
      id: generateId('h'),
      action: 'created',
      detail: `Added from Knowledge Library: ${libraryTopic.title}`,
      date: now,
    }];

    const { data: row, error: err } = await supabase
      .from('topics')
      .insert({
        title: libraryTopic.title,
        description: libraryTopic.description,
        status: 'to_learn',
        board_id: boardId,
        difficulty: libraryTopic.difficulty,
        review_date: null,
        deadline_date: null,
        checklist: [],
        resources: [],
        notes: '',
        history,
        library_topic_id: libraryTopic.id,
        created_at: now,
        updated_at: now,
        user_id: user.id,
      })
      .select('*')
      .maybeSingle();
    if (err || !row) { setError(err?.message ?? 'Failed to add topic from library'); return null; }

    if (libraryTopic.tags.length > 0) {
      await syncTopicTags(supabase, (row as RawTopic).id, libraryTopic.tags);
    }

    await fetchAll();
    return mapTopic(row as RawTopic, libraryTopic.tags);
  }, [fetchAll]);

  /**
   * Checks whether the user already has a topic copied from this library topic,
   * on any board. Used to warn before adding a duplicate (does not block it —
   * the same library topic may legitimately belong on more than one board).
   */
  const findExistingCopy = useCallback((libraryTopicId: string): Topic | undefined => {
    return topics.find((t) => t.libraryTopicId === libraryTopicId);
  }, [topics]);

  // Optimistic status update — used by DnD drag-and-drop
  const updateTopicStatus = useCallback(async (id: string, status: Status): Promise<void> => {
    const topic = topics.find((t) => t.id === id);
    if (!topic || topic.status === status) return;

    const { historyEntry } = computeStatusChange(topic, status);
    const newHistory = [...topic.history, historyEntry].slice(-50);

    // Apply optimistically
    setTopics((prev) => prev.map((t) =>
      t.id === id ? { ...t, status, history: newHistory } : t,
    ));

    const { error: err } = await supabase
      .from('topics')
      .update({ status, history: newHistory, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) =>
        t.id === id ? { ...t, status: topic.status, history: topic.history } : t,
      ));
    }
  }, [topics]);

  const deleteTopic = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('topics').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    await fetchAll();
  }, [fetchAll]);

  // ─── Optimistic sub-item mutations ─────────────────────────────────────────

  const toggleChecklistItem = useCallback(async (topicId: string, itemId: string): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const updated = topic.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: updated } : t));
    const { error: err } = await supabase
      .from('topics')
      .update({ checklist: updated, updated_at: new Date().toISOString() })
      .eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: topic.checklist } : t));
    }
  }, [topics]);

  const toggleResource = useCallback(async (topicId: string, resourceId: string): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const updated = topic.resources.map((r) =>
      r.id === resourceId ? { ...r, done: !r.done } : r,
    );
    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: updated } : t));
    const { error: err } = await supabase
      .from('topics')
      .update({ resources: updated, updated_at: new Date().toISOString() })
      .eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: topic.resources } : t));
    }
  }, [topics]);

  const addChecklistItem = useCallback(async (topicId: string, text: string): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const newItem: ChecklistItem = { id: generateId('c'), text, done: false };
    const updated = [...topic.checklist, newItem];

    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: updated } : t));

    const { error: err } = await supabase
      .from('topics').update({ checklist: updated, updated_at: new Date().toISOString() }).eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: topic.checklist } : t));
    }
  }, [topics]);

  const deleteChecklistItem = useCallback(async (topicId: string, itemId: string): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const updated = topic.checklist.filter((item) => item.id !== itemId);

    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: updated } : t));

    const { error: err } = await supabase
      .from('topics').update({ checklist: updated, updated_at: new Date().toISOString() }).eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, checklist: topic.checklist } : t));
    }
  }, [topics]);

  const addResource = useCallback(async (
    topicId: string,
    data: { title: string; type: Resource['type']; url: string },
  ): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const newResource: Resource = { id: generateId('r'), ...data, done: false };
    const updated = [...topic.resources, newResource];

    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: updated } : t));

    const { error: err } = await supabase
      .from('topics').update({ resources: updated, updated_at: new Date().toISOString() }).eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: topic.resources } : t));
    }
  }, [topics]);

  const deleteResource = useCallback(async (topicId: string, resourceId: string): Promise<void> => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    const updated = topic.resources.filter((r) => r.id !== resourceId);

    setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: updated } : t));

    const { error: err } = await supabase
      .from('topics').update({ resources: updated, updated_at: new Date().toISOString() }).eq('id', topicId);
    if (err) {
      setError(err.message);
      setTopics((prev) => prev.map((t) => t.id === topicId ? { ...t, resources: topic.resources } : t));
    }
  }, [topics]);

  // ─── Data management ────────────────────────────────────────────────────────

  const exportData = useCallback((): string => JSON.stringify({ boards, topics }, null, 2), [boards, topics]);

  const importData = useCallback(async (json: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.boards || !parsed.topics) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); return false; }

      const { error: boardsErr } = await supabase.from('boards').upsert(
        parsed.boards.map((b: Record<string, unknown>) => ({
          id: b.id, title: b.title, description: b.description ?? '',
          color: b.color ?? 'sky', icon: b.icon ?? 'Layout',
          user_id: user.id,
        })),
      );
      if (boardsErr) { setError(boardsErr.message); return false; }

      if (parsed.topics.length > 0) {
        const topicsToUpsert = parsed.topics.map((t: Record<string, unknown>) => ({
          id: t.id, title: t.title, description: t.description ?? '',
          status: t.status ?? 'to_learn', board_id: t.boardId ?? t.board_id,
          difficulty: t.difficulty ?? 'medium',
          review_date: t.reviewDate ?? t.review_date ?? null,
          deadline_date: t.deadlineDate ?? t.deadline_date ?? null,
          checklist: t.checklist ?? [], resources: t.resources ?? [],
          notes: t.notes ?? '', history: t.history ?? [],
          user_id: user.id,
        }));

        const { error: topicsErr } = await supabase.from('topics').upsert(topicsToUpsert);
        if (topicsErr) { setError(topicsErr.message); return false; }

        // Sync tags for each topic via topic_tags
        await Promise.all(
          parsed.topics.map((t: Record<string, unknown>) => {
            const tagNames = Array.isArray(t.tags) ? (t.tags as string[]) : [];
            return syncTopicTags(supabase, t.id as string, tagNames);
          }),
        );
      }

      await fetchAll();
      return true;
    } catch {
      return false;
    }
  }, [fetchAll]);

  const resetStats = useCallback(async (): Promise<void> => {
    if (topics.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); return; }

    // Reset status and history without touching updated_at —
    // updated_at is used as a proxy for "user activity" in analytics.
    // Writing now() here would create a false activity spike for all 352 topics.
    const { error: statusErr } = await supabase
      .from('topics')
      .update({ status: 'to_learn', history: [] })
      .eq('user_id', user.id);

    if (statusErr) { setError(statusErr.message); return; }

    // Reset checklists individually — only for topics that have checked items
    // (Supabase can't do per-row JSONB updates in a single query)
    const topicsWithChecked = topics.filter((t) => t.checklist.some((c) => c.done));
    if (topicsWithChecked.length > 0) {
      const results = await Promise.all(
        topicsWithChecked.map((t) =>
          supabase
            .from('topics')
            .update({ checklist: t.checklist.map((c) => ({ ...c, done: false })) })
            .eq('id', t.id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) { setError(failed.error.message); return; }
    }

    await fetchAll();
  }, [topics, fetchAll]);

  const resetData = useCallback(async (): Promise<void> => {
    await supabase.from('topics').delete().gte('created_at', '2000-01-01');
    await supabase.from('boards').delete().gte('created_at', '2000-01-01');
    await fetchAll();
  }, [fetchAll]);

  return {
    boards, topics, loading, error, realtimeStatus, refresh: fetchAll,
    createBoard, updateBoard, deleteBoard, duplicateBoard,
    createTopic, updateTopic, updateTopicStatus, duplicateTopic, deleteTopic,
    addTopicFromLibrary, findExistingCopy,
    addChecklistItem, deleteChecklistItem, toggleChecklistItem,
    addResource, deleteResource, toggleResource,
    exportData, importData, resetStats, resetData,
  };
}

export type DataStore = ReturnType<typeof useDataStore>;
