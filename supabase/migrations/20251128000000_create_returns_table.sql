create table if not exists public.returns (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  status text check (status in ('pending', 'approved', 'rejected', 'completed')) default 'pending',
  return_reason text not null,
  return_type text check (return_type in ('refund', 'exchange')) not null,
  items jsonb not null, -- Array of { product_id, variant_id, quantity }
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.returns enable row level security;

-- Policies
create policy "Users can view their own returns"
  on public.returns for select
  using (auth.uid() = user_id);

create policy "Users can create returns"
  on public.returns for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all returns"
  on public.returns for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update returns"
  on public.returns for update
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
