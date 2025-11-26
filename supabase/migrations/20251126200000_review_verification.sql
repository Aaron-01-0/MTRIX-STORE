-- Function to check if a user has purchased a specific product
-- Used to enforce "Verified Purchase" reviews

CREATE OR REPLACE FUNCTION public.check_user_purchased(check_product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
BEGIN
  -- Check if there is a completed order for this user containing the product
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = auth.uid()
    AND o.status = 'completed' -- Only count completed orders
    AND oi.product_id = check_product_id
  ) INTO has_purchased;

  RETURN has_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
