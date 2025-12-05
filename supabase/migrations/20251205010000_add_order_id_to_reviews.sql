-- Add order_id to product_reviews table
ALTER TABLE public.product_reviews 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON public.product_reviews(order_id);

-- Update RLS policies if necessary (existing ones likely cover it, but good to check)
-- "Users can create reviews" policy checks auth.uid() = user_id, which is still valid.
-- "Users can view own reviews" policy checks auth.uid() = user_id, still valid.

-- Create a function to check if an order item has been reviewed
CREATE OR REPLACE FUNCTION public.has_reviewed_order_item(check_order_id UUID, check_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.product_reviews 
    WHERE order_id = check_order_id 
    AND product_id = check_product_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.product_reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
