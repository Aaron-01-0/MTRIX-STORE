-- Create storage bucket for arena designs
INSERT INTO storage.buckets (id, name, public)
VALUES ('arena-designs', 'arena-designs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view arena designs
CREATE POLICY "Arena Designs Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'arena-designs' );

-- Policy: Authenticated users can upload to arena designs
CREATE POLICY "Arena Designs Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'arena-designs' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own arena design files
CREATE POLICY "Arena Designs Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'arena-designs' AND
  auth.uid() = owner
);

-- Policy: Users can delete their own arena design files
CREATE POLICY "Arena Designs Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'arena-designs' AND
  auth.uid() = owner
);
