-- Add columns to categories
alter table public.categories 
add column if not exists slug text,
add column if not exists meta_title text,
add column if not exists meta_description text,
add column if not exists display_order integer default 0;

-- Generate slugs for existing categories
update public.categories 
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

-- Make slug unique and not null
alter table public.categories 
alter column slug set not null,
add constraint categories_slug_key unique (slug);

-- Add tags to products
alter table public.products
add column if not exists tags text[] default array[]::text[];

-- Create index for faster slug lookups
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists products_tags_idx on public.products using gin (tags);
