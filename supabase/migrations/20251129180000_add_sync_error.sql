-- Add sync_error column to orders table for debugging Qikink integration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sync_error TEXT;
