-- Drop the existing foreign key constraint that incorrectly points to profiles
ALTER TABLE public.post_likes
DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE public.post_likes
ADD CONSTRAINT post_likes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
