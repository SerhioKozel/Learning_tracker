/*
# Recreate boards and topics with text IDs

The previous migration used uuid PKs, but the app uses short string IDs (e.g. 'b1', 't1').
Recreating with text PKs so seeded data and frontend-generated IDs work naturally.
No user data exists yet — tables were just created.
*/

DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS boards CASCADE;

CREATE TABLE IF NOT EXISTS boards (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'sky' CHECK (color IN ('sky','teal','amber','rose','emerald')),
  icon text NOT NULL DEFAULT 'Layout',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'to_learn' CHECK (status IN ('to_learn','learning','practice','review','completed')),
  board_id text NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
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
