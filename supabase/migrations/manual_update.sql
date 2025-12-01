-- 1. Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON public.activity_logs;

-- Recreate policies
CREATE POLICY "Admins can view all logs"
    ON public.activity_logs
    FOR SELECT
    USING (
        public.is_admin()
    );

CREATE POLICY "Service role can insert logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (true);

-- Create or replace RPC
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;

-- 2. Add video_url to social_content if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_content' AND column_name = 'video_url') THEN
        ALTER TABLE public.social_content ADD COLUMN video_url text;
    END IF;
END $$;
