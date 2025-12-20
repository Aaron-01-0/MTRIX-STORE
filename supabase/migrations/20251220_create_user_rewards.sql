-- Create user_rewards table to track individual user winnings
create table if not exists public.user_rewards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    coupon_id uuid references public.coupons(id) on delete cascade not null,
    code text not null, -- denormalized for easier lookup
    is_used boolean default false,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now()
);

-- RLS
alter table public.user_rewards enable row level security;

create policy "Users can view their own rewards"
    on public.user_rewards for select
    using (auth.uid() = user_id);

create policy "Users can insert their own rewards"
    on public.user_rewards for insert
    with check (auth.uid() = user_id);
    
create policy "Service role can manage rewards"
    on public.user_rewards for all
    to service_role
    using (true)
    with check (true);

-- Index for faster lookup
create index idx_user_rewards_user on public.user_rewards(user_id);
create index idx_user_rewards_code on public.user_rewards(code);
