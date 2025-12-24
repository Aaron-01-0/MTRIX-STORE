-- 1. Add Tracking Columns to User Rewards
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_id UUID;

-- 2. Update Increment Function to track Order and Time
CREATE OR REPLACE FUNCTION increment_coupon_usage(
  p_code TEXT,
  p_user_id UUID,
  p_order_id UUID DEFAULT NULL 
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment Coupon Use Count
  UPDATE coupons 
  SET used_count = used_count + 1 
  WHERE code = p_code;

  -- Mark User Reward as Used with Details
  UPDATE user_rewards 
  SET is_used = TRUE,
      used_at = NOW(),
      order_id = p_order_id
  WHERE code = p_code AND user_id = p_user_id;
  
END;
$$;


-- 3. Create Restore Function for Refunds/Cancellations
CREATE OR REPLACE FUNCTION restore_coupon_usage(
  p_code TEXT,
  p_user_id UUID
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrement Coupon Use Count (Prevent negative just in case)
  UPDATE coupons 
  SET used_count = GREATEST(0, used_count - 1)
  WHERE code = p_code;

  -- Restore User Reward (Make it available again)
  UPDATE user_rewards 
  SET is_used = FALSE,
      used_at = NULL,
      order_id = NULL
  WHERE code = p_code AND user_id = p_user_id;

END;
$$;
