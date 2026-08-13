import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../utils/date';
import { generateId } from '../utils/id';
import type {
  Board,
  Topic,
  Status,
  TopicType,
  Difficulty,
  ChecklistItem,
  Resource,
  HistoryEntry,
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
  type: string;
  difficulty: string;
  progress: number;
  tags: string[] | null;
  review_date: string | null;
  checklist: ChecklistItem[] | null;
  resources: Resource[] | null;
  notes: string | null;
  history: HistoryEntry[] | null;
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

function mapTopic(raw: RawTopic): Topic {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: raw.status as Status,
    boardId: raw.board_id,
    type: raw.type as TopicType,
    difficulty: raw.difficulty as Difficulty,
    progress: raw.progress,
    tags: raw.tags ?? [],
    reviewDate: raw.review_date,
    checklist: raw.checklist ?? [],
    resources: raw.resources ?? [],
    notes: raw.notes ?? '',
    history: raw.history ?? [],
    updatedAt: timeAgo(raw.updated_at),
    createdAt: raw.created_at.slice(0, 10),
  };
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

    const [topicsResult, boardsResult] = await Promise.all([
      supabase.from('topics').select('*').order('updated_at', { ascending: false }),
      supabase.from('boards').select('*').order('updated_at', { ascending: false }),
    ]);

    if (topicsResult.error || boardsResult.error) {
      setError(topicsResult.error?.message ?? boardsResult.error?.message ?? 'Failed to load data');
      setLoading(false);
      return;
    }

    const rawTopics = (topicsResult.data as RawTopic[]) ?? [];
    const rawBoards = (boardsResult.data as RawBoard[]) ?? [];

    setTopics(rawTopics.map(mapTopic));
    setBoards(rawBoards.map((b) => mapBoard(b, rawTopics)));
    setLoading(false);
  }, []);

  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Supabase Realtime subscription ────────────────────────────────────────
  // A single channel subscribes to all INSERT/UPDATE/DELETE events on both
  // tables. On any change we call fetchAll() to stay consistent with the DB.
  // This is intentionally simple — fine for a single-user tool where event
  // frequency is low. For high-frequency updates, apply the payload directly.

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
    const { data: row, error: err } = await supabase
      .from('boards')
      .insert({ title: data.title, description: data.description, color: data.color, icon: data.icon })
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

    const { data: newBoard, error: boardErr } = await supabase
      .from('boards')
      .insert({ title: `${board.title} (copy)`, description: board.description, color: board.color, icon: board.icon })
      .select('*')
      .maybeSingle();

    if (boardErr || !newBoard) { setError(boardErr?.message ?? 'Failed to duplicate board'); return; }

    const { data: boardTopics } = await supabase.from('topics').select('*').eq('board_id', id);
    if (boardTopics && boardTopics.length > 0) {
      const newTopics = boardTopics.map((t) => ({
        title: t.title, description: t.description, status: t.status,
        board_id: newBoard.id, type: t.type, difficulty: t.difficulty,
        progress: t.progress, tags: t.tags, review_date: t.review_date,
        checklist: t.checklist, resources: t.resources, notes: t.notes, history: t.history,
      }));
      await supabase.from('topics').insert(newTopics);
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

    const { data: row, error: err } = await supabase
      .from('topics')
      .insert({
        title: data.title, description: '', status: data.status ?? 'to_learn',
        board_id: data.boardId, type: 'learning', difficulty: 'medium',
        progress: 0, tags: [], review_date: null, checklist: [], resources: [],
        notes: '', history, created_at: now, updated_at: now,
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
      title: string; description: string; status: Status; type: TopicType;
      difficulty: Difficulty; progress: number; tags: string[];
      reviewDate: string | null; checklist: ChecklistItem[];
      resources: Resource[]; notes: string; history: HistoryEntry[];
    }>,
  ): Promise<void> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.type !== undefined) updates.type = data.type;
    if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
    if (data.progress !== undefined) updates.progress = data.progress;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.reviewDate !== undefined) updates.review_date = data.reviewDate;
    if (data.checklist !== undefined) updates.checklist = data.checklist;
    if (data.resources !== undefined) updates.resources = data.resources;
    if (data.notes !== undefined) updates.notes = data.notes;
    // Cap history at 50 entries to prevent unbounded JSONB growth (BL-001)
    if (data.history !== undefined) updates.history = data.history.slice(-50);

    const { error: err } = await supabase.from('topics').update(updates).eq('id', id);
    if (err) { setError(err?.message ?? 'Failed to update topic'); return; }
    await fetchAll();
  }, [fetchAll]);

  const duplicateTopic = useCallback(async (id: string): Promise<Topic | null> => {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return null;
    const now = new Date().toISOString();
    const history: HistoryEntry[] = [{ id: generateId('h'), action: 'created', detail: 'Duplicated from topic', date: now }];
    const { data: row, error: err } = await supabase
      .from('topics')
      .insert({
        title: `${topic.title} (copy)`,
        description: topic.description,
        status: 'to_learn',
        board_id: topic.boardId,
        type: topic.type,
        difficulty: topic.difficulty,
        progress: 0,
        tags: topic.tags,
        review_date: null,
        checklist: topic.checklist.map((c) => ({ ...c, done: false })),
        resources: topic.resources.map((r) => ({ ...r, done: false })),
        notes: topic.notes,
        history,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .maybeSingle();
    if (err || !row) { setError(err?.message ?? 'Failed to duplicate topic'); return null; }
    await fetchAll();
    return mapTopic(row as RawTopic);
  }, [topics, fetchAll]);

  // Optimistic status update — used by DnD drag-and-drop
  const updateTopicStatus = useCallback(async (id: string, status: Status): Promise<void> => {
    const topic = topics.find((t) => t.id === id);
    if (!topic || topic.status === status) return;

    // Apply optimistically so the card moves instantly
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));

    const { error: err } = await supabase
      .from('topics')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) {
      setError(err.message);
      // Rollback to original status
      setTopics((prev) => prev.map((t) => t.id === id ? { ...t, status: topic.status } : t));
    }
  }, [topics]);

  const deleteTopic = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('topics').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    await fetchAll();
  }, [fetchAll]);

  // ─── Optimistic sub-item mutations ─────────────────────────────────────────
  // Applied to local state immediately for instant feedback, persisted in background.

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
      for (const b of parsed.boards) {
        await supabase.from('boards').upsert({
          id: b.id, title: b.title, description: b.description ?? '',
          color: b.color ?? 'sky', icon: b.icon ?? 'Layout',
        });
      }
      for (const t of parsed.topics) {
        await supabase.from('topics').upsert({
          id: t.id, title: t.title, description: t.description ?? '',
          status: t.status ?? 'to_learn', board_id: t.boardId ?? t.board_id,
          type: t.type ?? 'learning', difficulty: t.difficulty ?? 'medium',
          progress: t.progress ?? 0, tags: t.tags ?? [],
          review_date: t.reviewDate ?? t.review_date ?? null,
          checklist: t.checklist ?? [], resources: t.resources ?? [],
          notes: t.notes ?? '', history: t.history ?? [],
        });
      }
      await fetchAll();
      return true;
    } catch {
      return false;
    }
  }, [fetchAll]);

  const resetData = useCallback(async (): Promise<void> => {
    await supabase.from('topics').delete().neq('id', '___impossible___');
    await supabase.from('boards').delete().neq('id', '___impossible___');
    await fetchAll();
  }, [fetchAll]);

  return {
    boards, topics, loading, error, realtimeStatus, refresh: fetchAll,
    createBoard, updateBoard, deleteBoard, duplicateBoard,
    createTopic, updateTopic, updateTopicStatus, duplicateTopic, deleteTopic,
    addChecklistItem, deleteChecklistItem,
    addResource, deleteResource,
    exportData, importData, resetData,
  };
}

export type DataStore = ReturnType<typeof useDataStore>;
