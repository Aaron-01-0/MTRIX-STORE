-- Create product status enum
create type public.product_status as enum ('draft', 'published', 'archived');

-- Add status column to products
alter table public.products 
add column status public.product_status not null default 'draft';

-- Migrate existing data
update public.products 
set status = case 
  when is_active = true then 'published'::public.product_status
  else 'draft'::public.product_status
end;

-- Create index for faster filtering
create index idx_products_status on public.products(status);
