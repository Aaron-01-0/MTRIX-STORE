-- Add missing columns to hero_images to match frontend HeroBuilder
ALTER TABLE public.hero_images
ADD COLUMN IF NOT EXISTS text_alignment TEXT DEFAULT 'center',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS overlay_gradient TEXT DEFAULT 'bg-gradient-to-t from-black via-black/50 to-transparent',
ADD COLUMN IF NOT EXISTS button_text TEXT,
ADD COLUMN IF NOT EXISTS button_link TEXT;

-- Migrate existing data from old cta_ columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hero_images' AND column_name = 'cta_text') THEN
        UPDATE public.hero_images SET button_text = cta_text WHERE button_text IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hero_images' AND column_name = 'cta_link') THEN
        UPDATE public.hero_images SET button_link = cta_link WHERE button_link IS NULL;
    END IF;
END $$;
