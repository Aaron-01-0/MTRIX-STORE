-- Add reaction_type to post_likes if it doesn't exist
ALTER TABLE public.post_likes 
ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'like';

-- Create a robust function to handle post reactions
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(
    p_post_id UUID,
    p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_existing_reaction TEXT;
    v_new_count INTEGER;
    v_action TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check for existing reaction
    SELECT reaction_type INTO v_existing_reaction
    FROM public.post_likes
    WHERE post_id = p_post_id AND user_id = v_user_id;

    IF v_existing_reaction IS NOT NULL THEN
        IF v_existing_reaction = p_reaction_type THEN
            -- Same reaction: Remove it (toggle off)
            DELETE FROM public.post_likes
            WHERE post_id = p_post_id AND user_id = v_user_id;
            v_action := 'removed';
        ELSE
            -- Different reaction: Update it
            UPDATE public.post_likes
            SET reaction_type = p_reaction_type
            WHERE post_id = p_post_id AND user_id = v_user_id;
            v_action := 'updated';
        END IF;
    ELSE
        -- No reaction: Insert new one
        INSERT INTO public.post_likes (post_id, user_id, reaction_type)
        VALUES (p_post_id, v_user_id, p_reaction_type);
        v_action := 'added';
    END IF;

    -- Get updated count
    SELECT likes_count INTO v_new_count
    FROM public.community_posts
    WHERE id = p_post_id;

    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'likes_count', v_new_count,
        'user_reaction', CASE WHEN v_action = 'removed' THEN NULL ELSE p_reaction_type END
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_post_reaction TO authenticated;
