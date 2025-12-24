-- Add Smart Coupon capabilities to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS allowed_emails text[],
ADD COLUMN IF NOT EXISTS restricted_products uuid[],
ADD COLUMN IF NOT EXISTS restricted_categories uuid[],
ADD COLUMN IF NOT EXISTS description text;

-- Create system_alerts table for escalation strategy
CREATE TABLE IF NOT EXISTS system_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    severity text CHECK (severity IN ('info', 'warning', 'critical')),
    component text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all alerts (assuming an 'admin' role exists or based on user_roles table)
-- Adjust policy as per existing RLS patterns
CREATE POLICY "Admins can view system alerts" ON system_alerts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Allow backend functions (service role) to insert alerts
CREATE POLICY "Service role can insert alerts" ON system_alerts
    FOR INSERT
    WITH CHECK (true); -- Service role bypasses RLS, but this allows explicit insert if needed by authenticated users (restrict if necessary)

-- Comment on columns
COMMENT ON COLUMN coupons.allowed_emails IS 'Array of email addresses allowed to use this coupon. If null, everyone can use it.';
COMMENT ON COLUMN coupons.restricted_products IS 'Array of product UUIDs that this coupon applies to.';
COMMENT ON COLUMN coupons.restricted_categories IS 'Array of category UUIDs that this coupon applies to.';
