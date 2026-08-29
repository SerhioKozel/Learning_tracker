-- One-time seed: populate library_topics from existing user topics.
-- Deduplicates by title (case-insensitive), keeping the first occurrence.
-- category = the title of the board the representative topic belonged to.
-- Tags are carried over from topic_tags for the representative topic.
--
-- This is a one-time data migration, not a repeatable schema change —
-- safe to re-run because of the NOT EXISTS guard on title.

DO $$
DECLARE
  rec RECORD;
  new_library_id uuid;
BEGIN
  FOR rec IN (
    SELECT DISTINCT ON (lower(t.title))
      t.id            AS topic_id,
      t.title,
      t.description,
      t.difficulty,
      b.title         AS category
    FROM topics t
    JOIN boards b ON b.id = t.board_id
    ORDER BY lower(t.title), t.created_at ASC
  )
  LOOP
    -- Skip if a library topic with this title already exists (idempotent re-run)
    IF NOT EXISTS (
      SELECT 1 FROM library_topics WHERE lower(title) = lower(rec.title)
    ) THEN
      INSERT INTO library_topics (title, description, difficulty, category)
      VALUES (rec.title, rec.description, rec.difficulty, rec.category)
      RETURNING id INTO new_library_id;

      -- Carry over tags from the representative topic
      INSERT INTO library_topic_tags (library_topic_id, tag_id)
      SELECT new_library_id, tt.tag_id
      FROM topic_tags tt
      WHERE tt.topic_id = rec.topic_id
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
