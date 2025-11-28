-- Add variant columns to product_images if they don't exist
ALTER TABLE public.product_images 
ADD COLUMN IF NOT EXISTS variant_type text,
ADD COLUMN IF NOT EXISTS variant_value text;
