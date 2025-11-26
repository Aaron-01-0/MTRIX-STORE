-- Add payment_type column to payment_transactions
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'razorpay';

-- Add method column to track payment method (card, upi, netbanking, etc)
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_method text;

-- Update RLS policies to allow admins to update payment transactions
CREATE POLICY "Admins can update payment transactions"
ON payment_transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add policy for admins to view all payments
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON payment_transactions;
CREATE POLICY "Admins can view all payment transactions"
ON payment_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id 
ON payment_transactions(razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
ON payment_transactions(status);