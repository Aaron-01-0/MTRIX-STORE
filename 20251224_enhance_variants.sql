-- 20251224_enhance_variants.sql

-- 1. Modify products table (Add support for Variant Flags)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS variant_type TEXT DEFAULT 'none' CHECK (variant_type IN ('none', 'single', 'multi'));

-- 2. Modify product_variants table (Add support for Flexible Attributes)
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS attribute_json JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Make size and color nullable (Safety Net for existing data, though they might already be populated)
ALTER TABLE public.product_variants ALTER COLUMN size DROP NOT NULL;
ALTER TABLE public.product_variants ALTER COLUMN color DROP NOT NULL;

-- 3. Create product_attributes table (Stores definitions like "Size", "Material")
CREATE TABLE IF NOT EXISTS public.product_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT NOT NULL, -- e.g. "Size", "Color"
    type TEXT DEFAULT 'text', -- text, color, etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, display_name)
);

-- 4. Create attribute_values table (Stores allowed values like "Small", "Red")
CREATE TABLE IF NOT EXISTS public.attribute_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE NOT NULL,
    value TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(attribute_id, value)
);

-- 5. Create inventory_history table (Stock Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
    quantity_change INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'restock', 'order', 'adjustment'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. RLS Policies
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- Product Attributes Policies
CREATE POLICY "Public attributes are viewable by everyone" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage attributes" ON public.product_attributes FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

-- Attribute Values Policies
CREATE POLICY "Public values are viewable by everyone" ON public.attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage values" ON public.attribute_values FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

-- Inventory History Policies
CREATE POLICY "Admins can view inventory history" ON public.inventory_history FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);
CREATE POLICY "Admins can insert inventory history" ON public.inventory_history FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);
