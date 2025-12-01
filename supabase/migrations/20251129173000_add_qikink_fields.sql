-- Add qikink_sku to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS qikink_sku text;

-- Add qikink_sku to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS qikink_sku text;

-- Add vendor_order_id to orders table to track Qikink Order ID
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS vendor_order_id text;

-- Add index for faster lookups on qikink_sku
CREATE INDEX IF NOT EXISTS idx_products_qikink_sku ON public.products(qikink_sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_qikink_sku ON public.product_variants(qikink_sku);
