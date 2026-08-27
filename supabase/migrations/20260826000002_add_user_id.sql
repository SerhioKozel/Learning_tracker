-- Migration: add user_id to boards and topics
-- Run AFTER 20260826000001_profiles.sql
-- Run BEFORE 20260826000003_rls.sql
--
-- Step 1: add nullable column (existing rows have no owner yet)
-- Step 2: you manually set user_id for existing rows via Dashboard or psql:
--   UPDATE boards SET user_id = '<your-admin-uuid>' WHERE user_id IS NULL;
--   UPDATE topics SET user_id = '<your-admin-uuid>' WHERE user_id IS NULL;
-- Step 3: run 20260826000003_rls.sql which enforces NOT NULL + new RLS

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for the most common query pattern: fetch all boards/topics for a user
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON boards(user_id);
CREATE INDEX IF NOT EXISTS topics_user_id_idx ON topics(user_id);
