-- Create drops table
CREATE TABLE IF NOT EXISTS public.drops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_active BOOLEAN DEFAULT true,
    drop_date TIMESTAMPTZ,
    category TEXT
);

-- Create social_content table
CREATE TABLE IF NOT EXISTS public.social_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    platform TEXT NOT NULL CHECK (platform IN ('instagram_post', 'instagram_reel')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Add RLS policies
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access on drops" ON public.drops
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access on social_content" ON public.social_content
    FOR SELECT TO public USING (true);

-- Allow write access to authenticated users (admins)
CREATE POLICY "Allow admin write access on drops" ON public.drops
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin write access on social_content" ON public.social_content
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
