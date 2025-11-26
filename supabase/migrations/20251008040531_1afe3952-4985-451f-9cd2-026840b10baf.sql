-- Add category_id to design_submissions and make product_id optional
ALTER TABLE public.design_submissions
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

ALTER TABLE public.design_submissions
ALTER COLUMN product_id DROP NOT NULL;

-- Optional: index for faster filtering
CREATE INDEX IF NOT EXISTS idx_design_submissions_category_id ON public.design_submissions(category_id);

-- No RLS changes needed; existing policies remain valid.
