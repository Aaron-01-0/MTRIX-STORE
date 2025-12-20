-- Create coupons table if it doesn't exist
create table if not exists public.coupons (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    description text,
    discount_type text not null check (discount_type in ('percentage', 'fixed')),
    discount_value numeric not null,
    min_order_value numeric default 0,
    max_discount_amount numeric,
    usage_limit integer,
    used_count integer default 0,
    valid_from timestamp with time zone default now(),
    valid_until timestamp with time zone,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies
-- Public can read active coupons (needed for checkout validation)
-- But maybe we only want them to read ONE specific coupon by code?
-- For now, allow reading active coupons.
create policy "Public can view active coupons"
    on public.coupons
    for select
    using (is_active = true);

-- Admins can do everything
create policy "Admins can manage coupons"
    on public.coupons
    for all
    to authenticated
    using (
        exists (
            select 1 from public.user_roles
            where user_id = auth.uid()
            and role = 'admin'
        )
    );

-- Add coupon_code to orders if not exists (already done in previous migration but good to be safe)
alter table public.orders 
add column if not exists coupon_code text,
add column if not exists discount_amount numeric default 0;
