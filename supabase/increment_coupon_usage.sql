-- Function to Increment Coupon Usage (Atomic)
CREATE OR REPLACE FUNCTION increment_coupon_usage(
  p_code TEXT,
  p_user_id UUID
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Increment Coupon Use Count
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE code = p_code;

  -- 2. Mark User Reward as Used (if applicable)
  UPDATE user_rewards 
  SET is_used = TRUE 
  WHERE code = p_code AND user_id = p_user_id;
  
END;
$$;
