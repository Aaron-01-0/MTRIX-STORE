-- Add variant-specific fields to product_variants table
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS absolute_price NUMERIC,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for SKU lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- Update product_images to support variant-specific images
ALTER TABLE public.product_images
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- Add index for variant image lookups
CREATE INDEX IF NOT EXISTS idx_product_images_variant ON public.product_images(variant_id);