-- Extend board color options from 5 to 9.
-- Safe to re-run: DROP CONSTRAINT IF EXISTS guards against the constraint being absent.

ALTER TABLE boards
  DROP CONSTRAINT IF EXISTS boards_color_check,
  ADD CONSTRAINT boards_color_check
    CHECK (color IN ('sky', 'cyan', 'teal', 'emerald', 'amber', 'orange', 'rose', 'violet', 'indigo'));
