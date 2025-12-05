-- Make color column nullable
ALTER TABLE public.product_variants ALTER COLUMN color DROP NOT NULL;

-- Drop the existing unique constraint if it exists (it was on product_id, color, size)
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_color_size_key;

-- Create a unique index for variants with color (standard behavior)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_unique_color_size 
ON public.product_variants (product_id, color, size) 
WHERE color IS NOT NULL;

-- Create a unique index for variants without color (size only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_unique_size_no_color 
ON public.product_variants (product_id, size) 
WHERE color IS NULL;
