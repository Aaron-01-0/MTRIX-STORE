-- Add policy for users to view their own roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add explicit deny policy for users updating orders
CREATE POLICY "Users cannot update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (false);

-- Create payment_transactions table for better security
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can view payment transactions
CREATE POLICY "Admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- System can insert payment transactions
CREATE POLICY "System can insert payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (true);

-- System can update payment transactions
CREATE POLICY "System can update payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();