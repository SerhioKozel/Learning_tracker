-- Knowledge Library — global, curated topics that users can add to their boards.
-- See ARCHITECTURE.md "Knowledge Library" section and DECISION-LOG.md DL-018.

-- ─── library_topics ─────────────────────────────────────────────────────────
-- Global, shared across all users. Only admins can write; everyone can read.
-- Mirrors a subset of `topics` fields — no status/progress/checklist/notes/history,
-- since those are per-user learning state, not library content.

CREATE TABLE IF NOT EXISTS library_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty  text NOT NULL DEFAULT 'medium'
                   CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category    text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_topics_category_idx ON library_topics (category);

-- ─── library_topic_tags ─────────────────────────────────────────────────────
-- Junction: LibraryTopic ↔ Tag. Separate from topic_tags because library_topics
-- and topics are different tables — a junction table can only reference one.
-- Reuses the same global `tags` table (system + custom).

CREATE TABLE IF NOT EXISTS library_topic_tags (
  library_topic_id uuid NOT NULL REFERENCES library_topics(id) ON DELETE CASCADE,
  tag_id           uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (library_topic_id, tag_id)
);

CREATE INDEX IF NOT EXISTS library_topic_tags_tag_id_idx ON library_topic_tags (tag_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE library_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_topic_tags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read the library
CREATE POLICY "library_topics: read for authenticated"
  ON library_topics FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can write to the library
CREATE POLICY "library_topics: write admin only"
  ON library_topics FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "library_topics: update admin only"
  ON library_topics FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "library_topics: delete admin only"
  ON library_topics FOR DELETE
  TO authenticated
  USING (is_admin());

-- Any authenticated user can read library tag associations (needed to display tags)
CREATE POLICY "library_topic_tags: read for authenticated"
  ON library_topic_tags FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can write library tag associations
CREATE POLICY "library_topic_tags: write admin only"
  ON library_topic_tags FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "library_topic_tags: delete admin only"
  ON library_topic_tags FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── topics.library_topic_id ────────────────────────────────────────────────
-- Tracks which library topic a user's topic was copied from, if any.
-- Nullable — most topics are created manually, not from the library.
-- ON DELETE SET NULL — if the library topic is later removed, the user's
-- copy is unaffected; it just loses the "sourced from library" link.

ALTER TABLE topics ADD COLUMN IF NOT EXISTS library_topic_id uuid
  REFERENCES library_topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS topics_library_topic_id_idx ON topics (library_topic_id);
