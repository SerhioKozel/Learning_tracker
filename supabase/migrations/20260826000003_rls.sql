-- Migration: enforce user_id + RLS
-- Run AFTER manually setting user_id for all existing rows:
--   UPDATE boards SET user_id = '<admin-uuid>' WHERE user_id IS NULL;
--   UPDATE topics SET user_id = '<admin-uuid>' WHERE user_id IS NULL;
-- If any NULLs remain, the ALTER below will fail — that is intentional.

-- 1. Enforce NOT NULL now that all rows have an owner
ALTER TABLE boards ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE topics ALTER COLUMN user_id SET NOT NULL;

-- 2. Helper function used in RLS policies.
--    SECURITY DEFINER runs as the function owner (postgres), not the caller,
--    so it can read profiles without a recursive RLS check.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Drop old permissive policies (USING (true))
--    Names may vary — adjust if your Supabase project used different names.
DROP POLICY IF EXISTS "Enable read access for all users" ON boards;
DROP POLICY IF EXISTS "Enable insert for all users"     ON boards;
DROP POLICY IF EXISTS "Enable update for all users"     ON boards;
DROP POLICY IF EXISTS "Enable delete for all users"     ON boards;

DROP POLICY IF EXISTS "Enable read access for all users" ON topics;
DROP POLICY IF EXISTS "Enable insert for all users"      ON topics;
DROP POLICY IF EXISTS "Enable update for all users"      ON topics;
DROP POLICY IF EXISTS "Enable delete for all users"      ON topics;

-- 4. New RLS policies for boards
--    Users access only their own rows.
--    Admin can read all rows (needed for platform statistics in AdminView).
CREATE POLICY "boards: select own or admin"
  ON boards FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "boards: insert own"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boards: update own"
  ON boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boards: delete own"
  ON boards FOR DELETE
  USING (auth.uid() = user_id);

-- 5. New RLS policies for topics
CREATE POLICY "topics: select own or admin"
  ON topics FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "topics: insert own"
  ON topics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topics: update own"
  ON topics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topics: delete own"
  ON topics FOR DELETE
  USING (auth.uid() = user_id);
