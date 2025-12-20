-- Secure the 'email' column in the wishes table
-- Currently, RLS allows reading the whole row. We want to hide 'email'.

-- 1. Revoke the default "Grant All" behavior for the public roles
REVOKE SELECT ON public.wishes FROM anon, authenticated;

-- 2. Explicitly GRANT access ONLY to public columns
-- Users can see the wish, the name, and the timestamp, but NOT the email.
GRANT SELECT (id, message, name, is_approved, created_at) ON public.wishes TO anon, authenticated;

-- Service role retains full access automatically (superuser-ish)
