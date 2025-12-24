-- Secure Function to Claim Reward
-- This function runs with SECURITY DEFINER to bypass RLS (run as admin)
CREATE OR REPLACE FUNCTION claim_reward(
  p_reward_type TEXT,
  p_user_id UUID
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_discount_type TEXT;
  v_discount_value NUMERIC;
  v_suffix TEXT;
  v_coupon_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. Configuration based on Type
  IF p_reward_type = 'WELCOME10' THEN
    v_discount_type := 'percentage';
    v_discount_value := 10;
  ELSIF p_reward_type = 'FREESHIP' THEN
    v_discount_type := 'free_shipping';
    v_discount_value := 0;
  ELSIF p_reward_type = 'LUCKY15' THEN
    v_discount_type := 'percentage';
    v_discount_value := 15;
  ELSIF p_reward_type = 'GOLDEN20' THEN
    v_discount_type := 'percentage';
    v_discount_value := 20;
  ELSE
    -- Mystery or No Discount (Or Invalid)
    -- Just mark as spun if not already done
    UPDATE profiles SET has_spun_wheel = TRUE WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'code', NULL);
  END IF;

  -- 2. Generate Unique Code
  v_suffix := upper(substring(md5(random()::text) from 1 for 4));
  v_code := p_reward_type || '-' || v_suffix;
  v_expires_at := now() + interval '7 days';

  -- 3. Create Coupon (Single Use)
  INSERT INTO coupons (
    code, 
    discount_type, 
    discount_value, 
    usage_limit, 
    used_count, 
    is_active, 
    valid_until, 
    description
  ) VALUES (
    v_code,
    v_discount_type,
    v_discount_value,
    1, -- Only 1 use
    0,
    TRUE,
    v_expires_at,
    'Reward Wheel Prize for ' || p_user_id
  ) RETURNING id INTO v_coupon_id;

  -- 4. Assign to User Rewards
  INSERT INTO user_rewards (
    user_id,
    coupon_id,
    code,
    expires_at
  ) VALUES (
    p_user_id,
    v_coupon_id,
    v_code,
    v_expires_at
  );

  -- 5. Update Profile Flag
  UPDATE profiles 
  SET has_spun_wheel = TRUE 
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'code', v_code);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
