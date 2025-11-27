-- Create brand_settings table
create table public.brand_settings (
  id uuid not null default gen_random_uuid() primary key,
  primary_color text not null default '#000000',
  secondary_color text not null default '#ffffff',
  accent_color text not null default '#ffd700',
  font_heading text not null default 'Inter',
  font_body text not null default 'Inter',
  logo_url text,
  favicon_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create media_assets table
create table public.media_assets (
  id uuid not null default gen_random_uuid() primary key,
  url text not null,
  type text not null check (type in ('image', 'video')),
  tags text[] default array[]::text[],
  source text not null default 'upload',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.brand_settings enable row level security;
alter table public.media_assets enable row level security;

-- Create policies (Allow all for now for admin simplicity, refine later)
create policy "Allow all access to brand_settings" on public.brand_settings for all using (true) with check (true);
create policy "Allow all access to media_assets" on public.media_assets for all using (true) with check (true);

-- Insert default brand settings
insert into public.brand_settings (primary_color, secondary_color, accent_color)
values ('#000000', '#ffffff', '#ffd700');
