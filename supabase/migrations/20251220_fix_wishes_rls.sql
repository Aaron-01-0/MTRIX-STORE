-- Fix RLS: Allow both 'launch subscribers' AND 'authenticated users' to insert wishes.
-- Currently, it restricts to ONLY launch_subscribers, blocking logged-in users.

DROP POLICY IF EXISTS "Verified emails can insert wishes" ON public.wishes;

CREATE POLICY "Allow authenticated or subscribers to insert wishes" ON public.wishes
    FOR INSERT
    WITH CHECK (
        -- Allow if user is logged in
        auth.role() = 'authenticated'
        OR
        -- Allow if email is in verified subscribers list (for anon/ComingSoon users)
        (
            exists (
                select 1 from public.launch_subscribers ls
                where ls.email = wishes.email
            )
        )
    );
