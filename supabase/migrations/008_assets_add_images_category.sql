-- Add 'images' to the allowed categories for project_assets
ALTER TABLE project_assets DROP CONSTRAINT IF EXISTS project_assets_category_check;
ALTER TABLE project_assets
  ADD CONSTRAINT project_assets_category_check
  CHECK (category IN ('prompts', 'story', 'scriptures', 'design', 'images'));
