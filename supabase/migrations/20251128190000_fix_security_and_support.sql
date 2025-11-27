-- Enable RLS on tables that were missing it
ALTER TABLE public.promotion_strips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create is_admin function if it doesn't exist (idempotent check)
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

-- Policies for contact_messages
CREATE POLICY "Public can insert messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage messages" ON public.contact_messages
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Policies for newsletter_subscriptions
CREATE POLICY "Public can subscribe" ON public.newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscriptions" ON public.newsletter_subscriptions
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Policies for categories (Public Read, Admin Write)
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Policies for brands (Public Read, Admin Write)
CREATE POLICY "Public can view brands" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage brands" ON public.brands
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Policies for promotion_strips (Public Read, Admin Write)
CREATE POLICY "Public can view promotion_strips" ON public.promotion_strips
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage promotion_strips" ON public.promotion_strips
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Policies for product_images (Public Read, Admin Write)
CREATE POLICY "Public can view product_images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage product_images" ON public.product_images
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Policies for stock_movements (Admin Only)
CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Fix Function Search Paths (Security Best Practice)
-- We use dynamic SQL to avoid errors if functions don't exist or have different signatures
DO $$
BEGIN
    -- handle_updated_at (Trigger function, usually no args)
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        EXECUTE 'ALTER FUNCTION public.handle_updated_at() SET search_path = public';
    END IF;

    -- handle_post_like (Trigger function, usually no args)
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_post_like') THEN
        EXECUTE 'ALTER FUNCTION public.handle_post_like() SET search_path = public';
    END IF;

    -- check_user_purchased (Known signature from previous migration)
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'check_user_purchased') THEN
        EXECUTE 'ALTER FUNCTION public.check_user_purchased(uuid) SET search_path = public';
    END IF;

    -- Attempt to fix other functions if they exist, ignoring errors if signature mismatches
    BEGIN
        IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_low_stock_products') THEN
            EXECUTE 'ALTER FUNCTION public.get_low_stock_products() SET search_path = public';
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        IF EXISTS (SELECT FROM pg_proc WHERE proname = 'sync_product_stock') THEN
            EXECUTE 'ALTER FUNCTION public.sync_product_stock() SET search_path = public';
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
