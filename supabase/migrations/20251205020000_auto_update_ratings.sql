-- Function to update product rating stats
CREATE OR REPLACE FUNCTION public.update_product_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET 
    ratings_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM public.product_reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
      AND is_approved = true
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for INSERT, UPDATE, DELETE on product_reviews
DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.product_reviews;

CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE OF rating, is_approved OR DELETE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating_stats();
