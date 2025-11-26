-- Add delivery tracking and updated order statuses
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamp with time zone;

-- Update order status enum to include new statuses
-- Note: Can't alter enum directly, so we'll use a check constraint instead
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'order_created', 'processing', 'shipping', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create hero_images table for admin-managed carousel
CREATE TABLE IF NOT EXISTS public.hero_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text,
  subtitle text,
  cta_text text,
  cta_link text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on hero_images
ALTER TABLE public.hero_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for hero_images
CREATE POLICY "Admins can manage hero images"
ON public.hero_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view active hero images"
ON public.hero_images
FOR SELECT
USING (is_active = true);

-- Create promotion_strips table for rollover banner
CREATE TABLE IF NOT EXISTS public.promotion_strips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on promotion_strips
ALTER TABLE public.promotion_strips ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_strips
CREATE POLICY "Admins can manage promotion strips"
ON public.promotion_strips
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can view active promotion strips"
ON public.promotion_strips
FOR SELECT
USING (is_active = true);

-- Add updated_at triggers
CREATE TRIGGER update_hero_images_updated_at
BEFORE UPDATE ON public.hero_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotion_strips_updated_at
BEFORE UPDATE ON public.promotion_strips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();