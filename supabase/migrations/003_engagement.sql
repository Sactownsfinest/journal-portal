-- ============================================================
-- ENGAGEMENT LETTERS
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update project status to include awaiting_deposit
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'awaiting_deposit', 'in_progress', 'ready_for_review', 'complete'));

-- Engagement letters table
CREATE TABLE IF NOT EXISTS public.engagement_letters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  content       text NOT NULL DEFAULT '',
  deposit_amount numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'sent', 'accepted')),
  accepted_at   timestamptz,
  accepted_by   uuid REFERENCES public.profiles(id),
  stripe_deposit_invoice_id text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.engagement_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on engagement_letters"
  ON public.engagement_letters FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Client can read own engagement letter"
  ON public.engagement_letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = engagement_letters.project_id
        AND projects.client_id = auth.uid()
    )
  );

CREATE POLICY "Client can accept own engagement letter"
  ON public.engagement_letters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = engagement_letters.project_id
        AND projects.client_id = auth.uid()
    )
  );
