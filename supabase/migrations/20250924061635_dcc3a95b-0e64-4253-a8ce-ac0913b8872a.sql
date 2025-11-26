-- Create comprehensive product management tables

-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Brands table
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  short_description text,
  detailed_description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  sku text UNIQUE NOT NULL,
  base_price decimal(10,2) NOT NULL,
  discount_price decimal(10,2),
  currency text DEFAULT 'INR',
  stock_quantity integer DEFAULT 0,
  stock_status text DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'pre_order')),
  minimum_order_quantity integer DEFAULT 1,
  weight decimal(8,2),
  dimensions jsonb, -- {width, height, depth}
  return_policy text,
  warranty_info text,
  vendor_info jsonb,
  internal_notes text,
  ratings_avg decimal(3,2) DEFAULT 0,
  ratings_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_new boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  meta_title text,
  meta_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product images table
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  is_main boolean DEFAULT false,
  display_order integer DEFAULT 0,
  variant_type text, -- 'color', 'size', 'style', etc.
  variant_value text, -- 'red', 'large', 'premium', etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product videos table
CREATE TABLE public.product_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  video_url text NOT NULL,
  video_type text DEFAULT 'youtube', -- 'youtube', 'vimeo', 'direct'
  title text,
  description text,
  thumbnail_url text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product variants table (for size, color, style variations)
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_type text NOT NULL, -- 'size', 'color', 'material', 'style'
  variant_name text NOT NULL, -- 'Large', 'Red', 'Cotton', 'Premium'
  price_adjustment decimal(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  sku_suffix text, -- adds to main SKU
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_type, variant_name)
);

-- Product reviews table
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  review_text text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Product Q&A table
CREATE TABLE public.product_qa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  answer text,
  asked_by_user_id uuid,
  answered_by_user_id uuid,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_qa ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view active products)
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_images.product_id AND is_active = true)
);
CREATE POLICY "Anyone can view product videos" ON public.product_videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_videos.product_id AND is_active = true)
);
CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (
  is_active = true AND EXISTS (SELECT 1 FROM public.products WHERE id = product_variants.product_id AND is_active = true)
);
CREATE POLICY "Anyone can view approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can view approved Q&A" ON public.product_qa FOR SELECT USING (is_approved = true);

-- User policies for reviews and Q&A
CREATE POLICY "Users can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own reviews" ON public.product_reviews FOR SELECT USING (auth.uid() = user_id OR is_approved = true);

CREATE POLICY "Users can ask questions" ON public.product_qa FOR INSERT WITH CHECK (auth.uid() = asked_by_user_id);
CREATE POLICY "Users can answer questions" ON public.product_qa FOR UPDATE USING (auth.uid() = answered_by_user_id OR asked_by_user_id = auth.uid());

-- Create user roles for admin access
CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'vendor');

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admin policies for full CRUD access
CREATE POLICY "Admins can manage all categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all brands" ON public.brands FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage product videos" ON public.product_videos FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all reviews" ON public.product_reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all Q&A" ON public.product_qa FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_qa_updated_at BEFORE UPDATE ON public.product_qa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update product ratings
CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products 
  SET 
    ratings_avg = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
        AND is_approved = true
    ),
    ratings_count = (
      SELECT COUNT(*) 
      FROM public.product_reviews 
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
        AND is_approved = true
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-update product ratings when reviews change
CREATE TRIGGER update_product_ratings_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_ratings();

-- Insert some sample data
INSERT INTO public.categories (name, description) VALUES 
('Phone Cases', 'Protective cases for smartphones'),
('Electronics', 'Electronic gadgets and accessories'),
('Clothing', 'Apparel and fashion items'),
('Home & Living', 'Home decor and lifestyle products');

INSERT INTO public.brands (name, description) VALUES 
('MTRIX', 'Premium lifestyle brand'),
('TechStyle', 'Modern tech accessories'),
('UrbanLife', 'Contemporary urban fashion');

-- Make the first user an admin (if any user exists)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;