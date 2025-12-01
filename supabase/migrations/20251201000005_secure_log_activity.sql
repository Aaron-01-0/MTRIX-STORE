-- Revoke execute from public (anon + authenticated) first
REVOKE EXECUTE ON FUNCTION public.log_activity FROM public;
REVOKE EXECUTE ON FUNCTION public.log_activity FROM anon;

-- Grant execute only to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO service_role;
