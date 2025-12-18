create table public.wishes (
  id uuid not null default gen_random_uuid (),
  message text not null,
  created_at timestamp with time zone not null default now(),
  is_approved boolean not null default true,
  constraint wishes_pkey primary key (id)
);

alter table public.wishes enable row level security;

create policy "Anyone can insert wishes" on public.wishes
  for insert
  with check (true);

create policy "Everyone can read approved wishes" on public.wishes
  for select
  using (is_approved = true);
