-- Create storage bucket for community content
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-content', 'community-content', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view community content
-- Using a specific name to avoid conflicts with generic "Public Access" policies
CREATE POLICY "Community Content Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'community-content' );

-- Policy: Authenticated users can upload to community content
CREATE POLICY "Community Content Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'community-content' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own community content files
CREATE POLICY "Community Content Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'community-content' AND
  auth.uid() = owner
);

-- Policy: Users can delete their own community content files
CREATE POLICY "Community Content Owner Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'community-content' AND
  auth.uid() = owner
);
