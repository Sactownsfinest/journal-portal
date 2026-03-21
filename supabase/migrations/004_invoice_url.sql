-- ============================================================
-- Add hosted_invoice_url to invoices
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS hosted_invoice_url text;
