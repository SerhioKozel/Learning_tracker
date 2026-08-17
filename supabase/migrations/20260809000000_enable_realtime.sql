-- Enable Supabase Realtime for boards and topics tables.
-- Required for postgres_changes subscriptions in the frontend.
-- Run this after the initial schema migration.
--
-- Guarded with a DO block: ALTER PUBLICATION ... ADD TABLE raises
-- "relation is already member of publication" on a second run otherwise.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'topics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE topics;
  END IF;
END $$;
