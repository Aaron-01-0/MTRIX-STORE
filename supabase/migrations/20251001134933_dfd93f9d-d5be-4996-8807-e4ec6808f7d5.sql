-- Create storage buckets for all media types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('product-videos', 'product-videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('hero-images', 'hero-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('promotion-images', 'promotion-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

-- RLS Policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- RLS Policies for product-videos bucket
CREATE POLICY "Anyone can view product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can update product videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-videos' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete product videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-videos' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- RLS Policies for hero-images bucket
CREATE POLICY "Anyone can view hero images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can manage hero images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'hero-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- RLS Policies for promotion-images bucket
CREATE POLICY "Anyone can view promotion images"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotion-images');

CREATE POLICY "Admins can manage promotion images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'promotion-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- RLS Policies for category-images bucket
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admins can manage category images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'category-images' 
  AND has_role(auth.uid(), 'admin'::user_role)
);