-- Phase 5: Low Stock Management

-- Add low stock management fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS reorder_point integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS reorder_quantity integer;

-- Add check constraints for low stock fields
ALTER TABLE products 
ADD CONSTRAINT products_low_stock_threshold_check CHECK (low_stock_threshold >= 0);

ALTER TABLE products 
ADD CONSTRAINT products_reorder_point_check CHECK (reorder_point >= 0);

ALTER TABLE products 
ADD CONSTRAINT products_reorder_quantity_check CHECK (reorder_quantity IS NULL OR reorder_quantity > 0);

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  id uuid,
  name text,
  sku text,
  stock_quantity integer,
  low_stock_threshold integer,
  reorder_point integer,
  reorder_quantity integer,
  category_name text,
  brand_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.low_stock_threshold,
    p.reorder_point,
    p.reorder_quantity,
    c.name as category_name,
    b.name as brand_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE p.is_active = true
    AND p.stock_quantity <= p.low_stock_threshold
  ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get low stock variants
CREATE OR REPLACE FUNCTION get_low_stock_variants()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  product_name text,
  color text,
  size text,
  sku text,
  stock_quantity integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.product_id,
    p.name as product_name,
    pv.color,
    pv.size,
    pv.sku,
    pv.stock_quantity
  FROM product_variants pv
  JOIN products p ON pv.product_id = p.id
  WHERE pv.is_active = true
    AND p.is_active = true
    AND pv.stock_quantity <= 5
  ORDER BY pv.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;