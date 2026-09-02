-- Adds the `progress` column to `topics`, computed client-side from checklist
-- completion (see calcProgress in useDataStore.ts). This column exists in
-- earlier migration files (20260805081441/544) but is absent from the actual
-- live schema — those files were apparently never applied to this project,
-- or the column was dropped out-of-band without a corresponding migration.
-- This migration is idempotent (IF NOT EXISTS) so it's safe to re-run.

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100);

-- Force PostgREST to reload its schema cache immediately, rather than
-- waiting for its next automatic refresh interval — without this, the
-- app would keep hitting "Could not find the 'progress' column" (PGRST204)
-- even after the column exists, until PostgREST notices the change on its own.
NOTIFY pgrst, 'reload schema';
