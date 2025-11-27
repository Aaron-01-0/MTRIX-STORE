-- Drop existing tables if they exist to ensure clean slate for new system
DROP TABLE IF EXISTS public.bundle_items;
DROP TABLE IF EXISTS public.bundles;

-- Create bundles table
CREATE TABLE public.bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('fixed', 'custom', 'quantity')),
    price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'percentage_discount', 'fixed_discount')),
    price_value NUMERIC NOT NULL,
    cover_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bundle_items table
CREATE TABLE public.bundle_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    slot_name TEXT, -- For custom bundles
    allowed_categories UUID[], -- For custom slots, generic category restriction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Public can view active bundles" ON public.bundles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage bundles" ON public.bundles
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
    );

-- Policies for bundle_items
CREATE POLICY "Public can view bundle items" ON public.bundle_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundle items" ON public.bundle_items
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
    );

-- Trigger for updated_at
CREATE TRIGGER update_bundles_updated_at
    BEFORE UPDATE ON public.bundles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
