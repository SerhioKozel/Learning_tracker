// useLibraryStore — Knowledge Library data access.
//
// Deliberately separate from useDataStore (DL-018): library data is global,
// rarely changes, and has no need for Realtime or optimistic updates. Mixing
// it into useDataStore would grow that hook's responsibilities beyond
// "the user's own boards and topics".
//
// Read access is open to any authenticated user. Write access (create/update/
// delete) is enforced by RLS to admins only — the mutations below will fail
// silently for non-admins at the database level; UI-level gating still
// belongs in the component (AdminRoute / role check).

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LibraryTopic, Difficulty } from '../types';

interface RawLibraryTopic {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  created_at: string;
  updated_at: string;
}

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mapLibraryTopic(raw: RawLibraryTopic, tagNames: string[] = []): LibraryTopic {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    difficulty: raw.difficulty as Difficulty,
    category: raw.category,
    tags: tagNames,
    createdAt: raw.created_at.slice(0, 10),
    updatedAt: raw.updated_at.slice(0, 10),
  };
}

/** Ensures all tag names exist in `tags` (upsert by slug); returns name → id map. */
async function upsertTags(names: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (names.length === 0) return result;

  const rows = names.map((name) => ({
    name: name.trim(),
    slug: toSlug(name),
    color: '#6b7280',
    type: 'custom' as const,
  }));

  const { data, error } = await supabase
    .from('tags')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, name');

  if (error || !data) return result;
  data.forEach((t: { id: string; name: string }) => result.set(t.name, t.id));
  return result;
}

async function syncLibraryTopicTags(libraryTopicId: string, tagNames: string[]): Promise<void> {
  await supabase.from('library_topic_tags').delete().eq('library_topic_id', libraryTopicId);
  if (tagNames.length === 0) return;

  const nameToId = await upsertTags(tagNames);
  const rows = tagNames
    .filter((name) => nameToId.has(name))
    .map((name) => ({ library_topic_id: libraryTopicId, tag_id: nameToId.get(name)! }));

  if (rows.length > 0) {
    await supabase.from('library_topic_tags').insert(rows);
  }
}

export function useLibraryStore() {
  const [libraryTopics, setLibraryTopics] = useState<LibraryTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [topicsResult, tagsResult] = await Promise.all([
      supabase.from('library_topics').select('*').order('category').order('title'),
      supabase.from('library_topic_tags').select('library_topic_id, tags(name)'),
    ]);

    if (topicsResult.error) {
      setError(topicsResult.error.message);
      setLoading(false);
      return;
    }

    const rawTopics = (topicsResult.data as RawLibraryTopic[]) ?? [];

    const tagsByTopic = new Map<string, string[]>();
    const tagRows = (tagsResult.data ?? []) as unknown as Array<{
      library_topic_id: string;
      tags: { name: string } | { name: string }[] | null;
    }>;
    tagRows.forEach((row) => {
      if (!row.tags) return;
      const tagName = Array.isArray(row.tags) ? row.tags[0]?.name : row.tags.name;
      if (!tagName) return;
      const names = tagsByTopic.get(row.library_topic_id) ?? [];
      names.push(tagName);
      tagsByTopic.set(row.library_topic_id, names);
    });

    setLibraryTopics(rawTopics.map((raw) => mapLibraryTopic(raw, tagsByTopic.get(raw.id) ?? [])));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Admin only (enforced by RLS). Creates a new library topic. */
  const createLibraryTopic = useCallback(async (data: {
    title: string;
    description: string;
    difficulty: Difficulty;
    category: string;
    tags: string[];
  }): Promise<LibraryTopic | null> => {
    const now = new Date().toISOString();
    const { data: row, error: err } = await supabase
      .from('library_topics')
      .insert({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        category: data.category,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .maybeSingle();

    if (err || !row) { setError(err?.message ?? 'Failed to create library topic'); return null; }

    if (data.tags.length > 0) {
      await syncLibraryTopicTags((row as RawLibraryTopic).id, data.tags);
    }

    await fetchAll();
    return mapLibraryTopic(row as RawLibraryTopic, data.tags);
  }, [fetchAll]);

  /** Admin only (enforced by RLS). Updates an existing library topic. */
  const updateLibraryTopic = useCallback(async (
    id: string,
    data: Partial<{
      title: string; description: string; difficulty: Difficulty;
      category: string; tags: string[];
    }>,
  ): Promise<void> => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
    if (data.category !== undefined) updates.category = data.category;

    const { error: err } = await supabase.from('library_topics').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }

    if (data.tags !== undefined) {
      await syncLibraryTopicTags(id, data.tags);
    }

    await fetchAll();
  }, [fetchAll]);

  /** Admin only (enforced by RLS). Deletes a library topic (cascade removes its tags). */
  const deleteLibraryTopic = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('library_topics').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    await fetchAll();
  }, [fetchAll]);

  return {
    libraryTopics,
    loading,
    error,
    refresh: fetchAll,
    createLibraryTopic,
    updateLibraryTopic,
    deleteLibraryTopic,
  };
}
