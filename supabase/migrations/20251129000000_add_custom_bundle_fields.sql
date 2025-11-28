ALTER TABLE bundle_items 
ADD COLUMN IF NOT EXISTS allowed_category_id UUID REFERENCES categories(id);

COMMENT ON COLUMN bundle_items.allowed_category_id IS 'If set, this slot can only be filled by products from this category (for custom bundles).';
