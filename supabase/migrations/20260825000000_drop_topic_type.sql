-- Remove the topic type column — the field is no longer part of the domain model.
-- Existing data is discarded; the column carried no meaningful business logic
-- that isn't already covered by board categorisation and topic tags.
ALTER TABLE topics DROP COLUMN IF EXISTS type;
