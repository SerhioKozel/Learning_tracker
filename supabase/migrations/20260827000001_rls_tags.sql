-- RLS for tags and topic_tags tables.
-- Run after 20260826000003_rls.sql (requires is_admin() function).
--
-- tags: global read for all authenticated users; write restricted to admins.
--   system tags are curated content — users must not be able to create/modify them.
--   custom tags are created implicitly via upsertTags() in useDataStore — allowed for any authed user.
--
-- topic_tags: users can only read/write associations for their own topics.
--   RLS on topics already enforces ownership; topic_tags mirrors that boundary.

-- ─── tags ────────────────────────────────────────────────────────────────────

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read all tags (needed to display tag names)
CREATE POLICY "tags: read for authenticated"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create custom tags (upsertTags in useDataStore)
CREATE POLICY "tags: insert custom for authenticated"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (type = 'custom');

-- Users can update only custom tags; admins can update any tag
CREATE POLICY "tags: update custom or admin"
  ON tags FOR UPDATE
  TO authenticated
  USING (type = 'custom' OR is_admin())
  WITH CHECK (type = 'custom' OR is_admin());

-- Only admins can delete tags (deleting a tag cascades to topic_tags)
CREATE POLICY "tags: delete admin only"
  ON tags FOR DELETE
  TO authenticated
  USING (is_admin());

-- ─── topic_tags ───────────────────────────────────────────────────────────────

ALTER TABLE topic_tags ENABLE ROW LEVEL SECURITY;

-- Users can read topic_tags only for topics they own
CREATE POLICY "topic_tags: select own"
  ON topic_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_tags.topic_id
        AND topics.user_id = auth.uid()
    )
    OR is_admin()
  );

-- Users can insert topic_tags only for topics they own
CREATE POLICY "topic_tags: insert own"
  ON topic_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_tags.topic_id
        AND topics.user_id = auth.uid()
    )
  );

-- Users can delete topic_tags only for topics they own
CREATE POLICY "topic_tags: delete own"
  ON topic_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_tags.topic_id
        AND topics.user_id = auth.uid()
    )
  );
