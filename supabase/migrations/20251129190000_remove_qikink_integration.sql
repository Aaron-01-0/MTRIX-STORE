-- Remove Qikink columns from products and product_variants
ALTER TABLE public.products DROP COLUMN IF EXISTS qikink_sku;
ALTER TABLE public.product_variants DROP COLUMN IF EXISTS qikink_sku;

-- Remove Qikink columns from orders
ALTER TABLE public.orders DROP COLUMN IF EXISTS vendor_order_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS sync_error;
