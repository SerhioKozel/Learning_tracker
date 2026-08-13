-- Enable Supabase Realtime for boards and topics tables.
-- Required for postgres_changes subscriptions in the frontend.
-- Run this after the initial schema migration.

ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE topics;
