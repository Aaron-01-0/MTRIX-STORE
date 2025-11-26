-- Add alt_text column to hero_images table for accessibility
ALTER TABLE public.hero_images 
ADD COLUMN IF NOT EXISTS alt_text text;