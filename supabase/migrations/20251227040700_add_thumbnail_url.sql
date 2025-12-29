-- Add thumbnail_url column to product_images table
alter table "public"."product_images" add column "thumbnail_url" text;

-- Add comment
comment on column "public"."product_images"."thumbnail_url" is 'URL for the small, resized version of the image (e.g. 400px width)';
