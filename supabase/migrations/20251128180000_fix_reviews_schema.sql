-- Handle reviews vs product_reviews table conflict
DO $$
BEGIN
    -- Case 1: Both tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') 
       AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_reviews') THEN
        
        -- Move data from reviews to product_reviews
        -- We map 'comment' to 'review_text' and 'status' (enum) to 'is_approved' (boolean)
        -- We use INSERT INTO ... SELECT ... ON CONFLICT DO NOTHING to avoid duplicates if IDs clash (though IDs are UUIDs so unlikely)
        INSERT INTO public.product_reviews (id, product_id, user_id, rating, review_text, created_at, updated_at, is_approved)
        SELECT 
            id,
            product_id, 
            user_id, 
            rating, 
            comment, 
            created_at, 
            updated_at, 
            CASE WHEN status = 'approved' THEN true ELSE false END
        FROM public.reviews
        ON CONFLICT (id) DO NOTHING;

        -- Drop the old table
        DROP TABLE public.reviews;
    
    -- Case 2: Only reviews exists
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        ALTER TABLE public.reviews RENAME TO product_reviews;
    END IF;
END $$;

-- Create product_reviews if it doesn't exist (and wasn't renamed/merged)
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    title TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they are missing (in case table existed but with different schema)
DO $$
BEGIN
    -- Rename comment to review_text if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'comment') THEN
        ALTER TABLE public.product_reviews RENAME COLUMN comment TO review_text;
    END IF;

    -- Add title if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'title') THEN
        ALTER TABLE public.product_reviews ADD COLUMN title TEXT;
    END IF;

    -- Add is_verified_purchase if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'is_verified_purchase') THEN
        ALTER TABLE public.product_reviews ADD COLUMN is_verified_purchase BOOLEAN DEFAULT false;
    END IF;

    -- Add is_approved if missing (handle status enum conversion if needed)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'is_approved') THEN
        ALTER TABLE public.product_reviews ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
    
    -- Drop status column if it exists (we use is_approved now)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'status') THEN
        ALTER TABLE public.product_reviews DROP COLUMN status;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.product_reviews;

-- Create new policies
-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews" ON public.product_reviews
    FOR SELECT
    USING (is_approved = true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can create reviews" ON public.product_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews (even if not approved)
CREATE POLICY "Users can view own reviews" ON public.product_reviews
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins can do everything
-- We use a secure function to check for admin role to avoid RLS recursion or access issues
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins have full access to reviews" ON public.product_reviews
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Fix Community Posts Policies as well to use is_admin()
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.community_posts;

CREATE POLICY "Admins can manage all posts" ON public.community_posts
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Ensure community_posts public policy is correct
DROP POLICY IF EXISTS "Public can view approved posts" ON public.community_posts;
CREATE POLICY "Public can view approved posts" ON public.community_posts
    FOR SELECT
    USING (status = 'approved');
