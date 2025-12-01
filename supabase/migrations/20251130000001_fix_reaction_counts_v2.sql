-- Add reaction_type to post_likes if it doesn't exist
ALTER TABLE public.post_likes 
ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like';

-- Drop the triggers that maintained the old likes_count column
DROP TRIGGER IF EXISTS update_post_likes_count ON public.post_likes;
DROP FUNCTION IF EXISTS public.handle_post_like();

-- Create the view for counting reactions
DROP VIEW IF EXISTS public.post_reaction_counts;
CREATE OR REPLACE VIEW public.post_reaction_counts AS
SELECT post_id, count(*) as count
FROM public.post_likes
GROUP BY post_id;

-- Grant access to the view
GRANT SELECT ON public.post_reaction_counts TO anon, authenticated, service_role;

-- Create a computed column function 'reaction_count' for community_posts
CREATE OR REPLACE FUNCTION public.reaction_count(post_record public.community_posts)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT count 
     FROM public.post_reaction_counts 
     WHERE post_id = post_record.id),
    0
  );
$$;
