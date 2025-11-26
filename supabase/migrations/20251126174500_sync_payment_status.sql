-- Function to sync payment status to orders table
CREATE OR REPLACE FUNCTION sync_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR (TG_OP = 'INSERT') THEN
    
    -- Map transaction status to order payment_status
    -- Transaction Statuses: created, authorized, captured, failed, refunded
    -- Order Payment Statuses: pending, paid, failed, refunded
    
    UPDATE orders
    SET payment_status = CASE
      WHEN NEW.status = 'captured' THEN 'paid'
      WHEN NEW.status = 'authorized' THEN 'pending'
      WHEN NEW.status = 'failed' THEN 'failed'
      WHEN NEW.status = 'refunded' THEN 'refunded'
      ELSE payment_status -- Keep existing if unknown status
    END,
    -- Also update order status if payment failed or was refunded
    status = CASE
      WHEN NEW.status = 'failed' THEN 'cancelled' -- Optional: auto-cancel order on payment failure? Maybe just keep as pending/created? Let's keep it safe and only mark payment_status.
      WHEN NEW.status = 'refunded' THEN 'refunded'
      ELSE status
    END
    WHERE id = NEW.order_id;
    
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_payment_status_change ON payment_transactions;

CREATE TRIGGER on_payment_status_change
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_order_payment_status();
