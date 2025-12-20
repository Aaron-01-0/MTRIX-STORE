create table if not exists public.otp_verifications (
  id uuid not null default gen_random_uuid (),
  email text not null,
  otp text not null,
  expires_at timestamp with time zone not null,
  verified boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint otp_verifications_pkey primary key (id)
);

alter table public.otp_verifications enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'otp_verifications' 
        and policyname = 'Service Role Full Access'
    ) then
        create policy "Service Role Full Access" on public.otp_verifications
            for all
            to service_role
            using (true)
            with check (true);
    end if;
end
$$;
