-- Allow admins to view all profiles
-- This is required for Admin features that display user information (e.g. Reviews, Orders)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Also ensure addresses are visible to admins (for Order Management)
CREATE POLICY "Admins can view all addresses" ON public.addresses
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
