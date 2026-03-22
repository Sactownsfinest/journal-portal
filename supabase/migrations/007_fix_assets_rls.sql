-- Fix project_assets RLS: use SECURITY DEFINER function to bypass nested RLS
-- and add explicit WITH CHECK for inserts

DROP POLICY IF EXISTS "client_own_assets" ON public.project_assets;

CREATE OR REPLACE FUNCTION public.client_owns_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
      AND client_id = auth.uid()
  );
$$;

CREATE POLICY "client_own_assets" ON public.project_assets
  FOR ALL TO authenticated
  USING (client_owns_project(project_id))
  WITH CHECK (client_owns_project(project_id));
