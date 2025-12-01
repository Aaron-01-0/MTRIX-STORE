-- Create announcements table for site banners
create table if not exists public.announcements (
    id uuid default gen_random_uuid() primary key,
    message text not null,
    link text,
    type text default 'info' check (type in ('info', 'warning', 'success')),
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create broadcasts table for email history
create table if not exists public.broadcasts (
    id uuid default gen_random_uuid() primary key,
    subject text not null,
    content text not null,
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
    recipient_count integer default 0,
    status text default 'sent' check (status in ('sent', 'failed'))
);

-- Enable RLS
alter table public.announcements enable row level security;
alter table public.broadcasts enable row level security;

-- Policies for announcements
-- Everyone can view active announcements
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
create policy "Anyone can view active announcements"
    on public.announcements
    for select
    using (is_active = true);

-- Admins can view all announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
create policy "Admins can view all announcements"
    on public.announcements
    for select
    using (
        auth.role() = 'service_role' or
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );

-- Admins can insert/update/delete announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
create policy "Admins can manage announcements"
    on public.announcements
    for all
    using (
        auth.role() = 'service_role' or
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );

-- Policies for broadcasts
-- Only admins can view broadcasts
DROP POLICY IF EXISTS "Admins can view broadcasts" ON public.broadcasts;
create policy "Admins can view broadcasts"
    on public.broadcasts
    for select
    using (
        auth.role() = 'service_role' or
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );

-- Only admins/service role can insert broadcasts
DROP POLICY IF EXISTS "Admins can insert broadcasts" ON public.broadcasts;
create policy "Admins can insert broadcasts"
    on public.broadcasts
    for insert
    with check (
        auth.role() = 'service_role' or
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );
