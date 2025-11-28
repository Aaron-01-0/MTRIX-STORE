-- Create invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Read (Anyone can download invoices if they have the link)
CREATE POLICY "Public Access Invoices"
ON storage.objects FOR SELECT
USING ( bucket_id = 'invoices' );

-- Policy: Service Role Full Access (Implicit, but good for documentation)
-- Service role bypasses RLS, so no specific INSERT policy needed for the Edge Function.
