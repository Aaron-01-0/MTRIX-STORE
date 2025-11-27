-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing table to ensure schema compatibility
DROP TABLE IF EXISTS public.product_variants CASCADE;

-- Create product_variants table
CREATE TABLE public.product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    price DECIMAL(10, 2), -- Nullable, inherits from product if null
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, color, size)
);

-- Add index for performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policies (Public read, Admin all)
CREATE POLICY "Public variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);

-- Trigger to update updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
