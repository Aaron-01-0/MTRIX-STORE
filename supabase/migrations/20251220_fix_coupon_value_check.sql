-- Relax discount_value check to allow 0 for free_shipping
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_value_check;

ALTER TABLE public.coupons ADD CONSTRAINT coupons_discount_value_check 
    CHECK (discount_value > 0 OR discount_type = 'free_shipping');
