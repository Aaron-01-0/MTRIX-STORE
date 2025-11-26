-- Ensure the column exists (in case it's actually missing)
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS payment_method text;

-- Reload the schema cache to ensure the API knows about it
NOTIFY pgrst, 'reload config';
