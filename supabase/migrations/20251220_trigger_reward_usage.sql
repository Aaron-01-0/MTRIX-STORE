
-- Function to mark reward as used when order is paid
CREATE OR REPLACE FUNCTION public.mark_reward_as_used()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if payment is successful and coupon code is present
    IF (NEW.payment_status = 'success' AND NEW.coupon_code IS NOT NULL) THEN
        -- Mark user_reward as used
        UPDATE public.user_rewards
        SET is_used = TRUE
        WHERE user_id = NEW.user_id
          AND code = NEW.coupon_code
          AND is_used = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_mark_reward_used ON public.orders;
CREATE TRIGGER trigger_mark_reward_used
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (NEW.payment_status = 'success' AND OLD.payment_status IS DISTINCT FROM 'success')
    EXECUTE FUNCTION public.mark_reward_as_used();
