-- Add reminder_sent_at column to cart_items to track abandoned cart emails
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
