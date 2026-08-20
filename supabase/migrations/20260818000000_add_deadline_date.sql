-- Add deadline_date to topics.
-- review_date is kept as-is (existing data preserved, column not dropped).
-- deadline_date is a new optional field for MVP deadline tracking.

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS deadline_date date;
