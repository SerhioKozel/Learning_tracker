/*
# Create boards and topics tables (single-tenant, no auth)

1. New Tables
- `boards`: Learning area / category (e.g. "Frontend", "Algorithms")
  - id (uuid PK), title, description, color (sky/teal/amber/rose/emerald), icon (string name), created_at, updated_at
- `topics`: Individual learning topics that belong to a board
  - id (uuid PK), title, description, status (to_learn/learning/practice/review/completed),
    board_id (FK → boards), type, difficulty, progress (int), tags (text[]), review_date (date nullable),
    checklist (jsonb array), resources (jsonb array), notes (text), history (jsonb array),
    created_at, updated_at

2. Security
- Enable RLS on both tables.
- Single-tenant no-auth app: allow anon + authenticated full CRUD (data is intentionally shared/public).
- `USING (true)` / `WITH CHECK (true)` is acceptable here because there is no sign-in screen
  and the data is meant to be publicly accessible via the anon key.

3. Indexes
- Index on topics.board_id for board-filtered queries.
- Index on topics.status for kanban column queries.
- Index on topics.review_date for calendar queries.
*/

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'sky' CHECK (color IN ('sky','teal','amber','rose','emerald')),
  icon text NOT NULL DEFAULT 'Layout',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'to_learn' CHECK (status IN ('to_learn','learning','practice','review','completed')),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'learning' CHECK (type IN ('learning','book','video','course','documentation','repository','interview','certification','project','custom')),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags text[] NOT NULL DEFAULT '{}',
  review_date date,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topics_board_id ON topics(board_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_review_date ON topics(review_date);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_boards" ON boards;
CREATE POLICY "anon_select_boards" ON boards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_boards" ON boards;
CREATE POLICY "anon_insert_boards" ON boards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_boards" ON boards;
CREATE POLICY "anon_update_boards" ON boards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_boards" ON boards;
CREATE POLICY "anon_delete_boards" ON boards FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_topics" ON topics;
CREATE POLICY "anon_select_topics" ON topics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_topics" ON topics;
CREATE POLICY "anon_insert_topics" ON topics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_topics" ON topics;
CREATE POLICY "anon_update_topics" ON topics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_topics" ON topics;
CREATE POLICY "anon_delete_topics" ON topics FOR DELETE
  TO anon, authenticated USING (true);
