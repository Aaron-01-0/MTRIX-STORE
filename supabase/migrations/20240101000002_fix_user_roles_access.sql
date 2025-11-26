-- Grant access to user_roles for authenticated users
GRANT SELECT ON user_roles TO authenticated;

-- Enable RLS on user_roles if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all payment transactions
CREATE POLICY "Admins can view all payment transactions"
ON payment_transactions FOR ALL
USING (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  )
);

-- Grant necessary permissions for payment_transactions
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON payment_transactions TO service_role;
