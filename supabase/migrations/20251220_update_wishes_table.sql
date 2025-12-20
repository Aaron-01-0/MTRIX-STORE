alter table public.wishes
add column if not exists name text,
add column if not exists email text;

-- Optional: Add index for faster queries if table grows huge (not strictly needed yet but good practice)
-- create index if not exists wishes_email_idx on public.wishes (email);
