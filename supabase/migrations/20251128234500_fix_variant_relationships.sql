-- Clean up orphaned variant_ids in order_items
UPDATE public.order_items
SET variant_id = NULL
WHERE variant_id IS NOT NULL
AND variant_id NOT IN (SELECT id FROM public.product_variants);

-- Restore foreign key for order_items
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_variant_id_fkey
FOREIGN KEY (variant_id)
REFERENCES public.product_variants(id)
ON DELETE SET NULL;

-- Clean up orphaned variant_ids in cart_items
UPDATE public.cart_items
SET variant_id = NULL
WHERE variant_id IS NOT NULL
AND variant_id NOT IN (SELECT id FROM public.product_variants);

-- Restore foreign key for cart_items
ALTER TABLE public.cart_items
ADD CONSTRAINT cart_items_variant_id_fkey
FOREIGN KEY (variant_id)
REFERENCES public.product_variants(id)
ON DELETE SET NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
