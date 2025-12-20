-- 1. Hardening launch_subscribers
-- Remove public access so people can't bypass OTP
drop policy if exists "Anyone can subscribe" on public.launch_subscribers;

-- Create Service Role Only policy
create policy "Service Role Only" on public.launch_subscribers
    for all
    to service_role
    using (true)
    with check (true);

-- 2. Hardening wishes
-- Remove open access
drop policy if exists "Anyone can insert wishes" on public.wishes;

-- Allow insert ONLY if the email is in the subscribers list (Verified)
-- "wishes.email" refers to the row being inserted
create policy "Verified emails can insert wishes" on public.wishes
    for insert
    with check (
        exists (
            select 1 from public.launch_subscribers ls
            where ls.email = wishes.email
        )
    );
