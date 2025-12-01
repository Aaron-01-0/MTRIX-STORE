-- Add likes_count column to community_posts
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Update existing rows to have 0 if null (though default handles new ones)
UPDATE public.community_posts SET likes_count = 0 WHERE likes_count IS NULL;
