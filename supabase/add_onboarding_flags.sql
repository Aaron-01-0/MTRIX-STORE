-- Add onboarding tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_spun_wheel BOOLEAN DEFAULT FALSE;

-- Force update RLS if needed (optional, assuming profiles allows update of own row)
-- POLICY: Users can update their own profile
-- (Usually exists, but ensuring we don't break strict RLS)
