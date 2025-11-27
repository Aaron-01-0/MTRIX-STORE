-- Fix Foreign Key on product_reviews to allow joining with profiles
-- Currently it references auth.users, but we need it to reference profiles for the frontend query to work

DO $$
BEGIN
    -- Drop existing FK if it exists (name might vary, so we try standard names or generic drop)
    -- We'll try to find the constraint name first
    DECLARE
        fk_name text;
    BEGIN
        SELECT conname INTO fk_name
        FROM pg_constraint
        WHERE conrelid = 'public.product_reviews'::regclass
        AND confrelid = 'auth.users'::regclass
        AND contype = 'f';

        IF fk_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.product_reviews DROP CONSTRAINT ' || fk_name;
        END IF;
    END;

    -- Also drop if it references profiles(id) by mistake (unlikely but good to clean)
    DECLARE
        fk_name_prof text;
    BEGIN
        SELECT conname INTO fk_name_prof
        FROM pg_constraint
        WHERE conrelid = 'public.product_reviews'::regclass
        AND confrelid = 'public.profiles'::regclass
        AND contype = 'f';

        IF fk_name_prof IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.product_reviews DROP CONSTRAINT ' || fk_name_prof;
        END IF;
    END;

    -- Add new FK referencing profiles(user_id)
    -- profiles.user_id is UNIQUE, so this is valid
    ALTER TABLE public.product_reviews
    ADD CONSTRAINT product_reviews_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;

END $$;
