-- Project Assets table for client/admin shared file uploads
CREATE TABLE IF NOT EXISTS public.project_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  category text NOT NULL CHECK (category IN ('prompts', 'story', 'scriptures', 'design')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS: admin sees all; client sees only their project assets
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_assets" ON public.project_assets
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "client_own_assets" ON public.project_assets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_assets.project_id
        AND projects.client_id = auth.uid()
    )
  );
