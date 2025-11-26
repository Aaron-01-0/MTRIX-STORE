-- Fix database functions missing fixed search_path
CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET 
    ratings_avg = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
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
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_design_votes_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.design_submissions
    SET votes_count = votes_count + 1
    WHERE id = NEW.design_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.design_submissions
    SET votes_count = votes_count - 1
    WHERE id = OLD.design_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- Fix payment transactions RLS policy - restrict updates to pending/created status only
DROP POLICY IF EXISTS "System can update payment transactions" ON payment_transactions;

CREATE POLICY "System can update pending transactions"
ON public.payment_transactions
FOR UPDATE
USING (status IN ('pending', 'created'));

-- Make design-submissions storage bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'design-submissions';

-- Add RLS policies for design-submissions bucket
CREATE POLICY "Users can view own designs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'design-submissions' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all designs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'design-submissions' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Public can view approved designs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'design-submissions' AND
  EXISTS (
    SELECT 1 FROM public.design_submissions
    WHERE design_url LIKE '%' || name || '%' AND status = 'approved'
  )
);