-- Ensure tracking columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamp with time zone;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
