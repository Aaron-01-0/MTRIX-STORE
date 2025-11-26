-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for themes
CREATE POLICY "Anyone can view active themes"
ON public.themes FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all themes"
ON public.themes FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add trigger for updated_at
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Enable realtime for themes
ALTER PUBLICATION supabase_realtime ADD TABLE public.themes;