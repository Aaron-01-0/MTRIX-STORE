-- Fix RLS policies for design-submissions bucket to allow admin uploads

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can upload their own designs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all designs" ON storage.objects;
DROP POLICY IF EXISTS "Public can view approved designs" ON storage.objects;

-- Allow admins to manage all files in design-submissions bucket
CREATE POLICY "Admins can manage design submissions"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'design-submissions' 
  AND has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  bucket_id = 'design-submissions' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

-- Allow users to upload their own design submissions
CREATE POLICY "Users can upload design submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'design-submissions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own design submissions
CREATE POLICY "Users can view their own design submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'design-submissions'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);