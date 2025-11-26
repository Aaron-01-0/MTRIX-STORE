-- Create table for launch subscribers
create table if not exists public.launch_subscribers (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    status text default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.launch_subscribers enable row level security;

-- Policies
-- Allow anyone to insert (subscribe)
create policy "Anyone can subscribe"
    on public.launch_subscribers
    for insert
    with check (true);

-- Allow admins to view all subscribers
create policy "Admins can view subscribers"
    on public.launch_subscribers
    for select
    using (
        auth.role() = 'service_role' or
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );
