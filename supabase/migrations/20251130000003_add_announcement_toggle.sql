ALTER TABLE public.brand_settings
ADD COLUMN IF NOT EXISTS show_announcement_bar BOOLEAN DEFAULT true;
