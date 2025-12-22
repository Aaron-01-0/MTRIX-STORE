-- Run this in your Supabase SQL Editor to allow public/anonymous users to submit wishes

-- 1. Enable RLS (if not already)
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- 2. Allow anonymous users to INSERT wishes
CREATE POLICY "Allow public insert to wishes"
ON wishes
FOR INSERT
TO public
WITH CHECK (true);

-- 3. Allow anonymous users to SELECT/READ wishes (if you want them to see the community list)
CREATE POLICY "Allow public read wishes"
ON wishes
FOR SELECT
TO public
USING (true);

-- 4. Allow duplicate emails if you want the Upsert logic to work (requires unique index)
-- OPTIONAL: Create unique index on email if not exists
-- CREATE UNIQUE INDEX IF NOT EXISTS wishes_email_idx ON wishes (email);
