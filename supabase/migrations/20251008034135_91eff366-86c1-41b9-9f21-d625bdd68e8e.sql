-- Create design_submissions table
CREATE TABLE public.design_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  design_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  votes_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create design_votes table
CREATE TABLE public.design_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES public.design_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, design_id)
);

-- Create custom_products table (for completed designs)
CREATE TABLE public.custom_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_submission_id UUID NOT NULL REFERENCES public.design_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  final_design_url TEXT NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_submissions
CREATE POLICY "Anyone can view approved designs"
ON public.design_submissions FOR SELECT
USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create their own designs"
ON public.design_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
ON public.design_submissions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all designs"
ON public.design_submissions FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for design_votes
CREATE POLICY "Anyone can view votes"
ON public.design_votes FOR SELECT
USING (true);

CREATE POLICY "Users can vote on designs"
ON public.design_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.design_votes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for custom_products
CREATE POLICY "Users can view their own custom products"
ON public.custom_products FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all custom products"
ON public.custom_products FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create storage bucket for designs
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-submissions', 'design-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for design submissions
CREATE POLICY "Users can upload their designs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'design-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view designs"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-submissions');

CREATE POLICY "Users can update their own designs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'design-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own designs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'design-submissions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger to update votes_count
CREATE OR REPLACE FUNCTION update_design_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.design_submissions
    SET votes_count = votes_count + 1
    WHERE id = NEW.design_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.design_submissions
    SET votes_count = votes_count - 1
    WHERE id = OLD.design_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_count_trigger
AFTER INSERT OR DELETE ON public.design_votes
FOR EACH ROW EXECUTE FUNCTION update_design_votes_count();

-- Trigger for updated_at
CREATE TRIGGER update_design_submissions_updated_at
BEFORE UPDATE ON public.design_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();