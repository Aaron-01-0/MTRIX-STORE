-- Give explicit INSERT permission to authenticated and anon users
-- This fixes the "permission denied" error (42501)
GRANT INSERT ON public.wishes TO anon, authenticated;

-- Ensure sequence permission if needed (usually handled by uuid gen)
