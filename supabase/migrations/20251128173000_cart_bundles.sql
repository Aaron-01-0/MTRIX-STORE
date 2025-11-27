-- Add bundle_id to cart_items to track which bundle an item belongs to
ALTER TABLE public.cart_items
ADD COLUMN bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_cart_items_bundle_id ON public.cart_items(bundle_id);
