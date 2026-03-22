-- Admin-set expected total section count, used as the progress denominator
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_sections integer;
