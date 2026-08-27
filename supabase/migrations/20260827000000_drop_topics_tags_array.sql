-- Remove the legacy tags text[] column from topics.
-- Tags are now managed exclusively via the tags + topic_tags tables (TD-21).
-- Data was already present in topic_tags before this migration.
ALTER TABLE topics DROP COLUMN IF EXISTS tags;
