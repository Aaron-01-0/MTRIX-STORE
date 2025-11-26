-- Phase 0: Fix data integrity issues

-- Fix duplicate SKUs in product_variants by appending UUID
UPDATE product_variants
SET sku = sku || '-' || substring(id::text from 1 for 8)
WHERE sku IN (
  SELECT sku
  FROM product_variants
  WHERE sku IS NOT NULL
  GROUP BY sku
  HAVING COUNT(*) > 1
);

-- Fix products where discount_price >= base_price (set discount to NULL if invalid)
UPDATE products
SET discount_price = NULL
WHERE discount_price IS NOT NULL AND discount_price >= base_price;

-- Phase 1: Database Integrity

-- Drop and recreate foreign key constraints
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_variants 
ADD CONSTRAINT product_variants_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE product_images 
ADD CONSTRAINT product_images_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_variant_id_fkey;
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
ALTER TABLE order_items 
ADD CONSTRAINT order_items_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;

-- Add unique constraints for SKUs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_unique') THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_sku_unique') THEN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_sku_unique UNIQUE (sku);
  END IF;
END $$;

-- Add check constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_quantity_check;
ALTER TABLE products ADD CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_base_price_check;
ALTER TABLE products ADD CONSTRAINT products_base_price_check CHECK (base_price > 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_discount_price_check;
ALTER TABLE products ADD CONSTRAINT products_discount_price_check CHECK (discount_price IS NULL OR discount_price < base_price);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_minimum_order_quantity_check;
ALTER TABLE products ADD CONSTRAINT products_minimum_order_quantity_check CHECK (minimum_order_quantity > 0);

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_stock_quantity_check;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_stock_quantity_check CHECK (stock_quantity >= 0);

ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_absolute_price_check;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_absolute_price_check CHECK (absolute_price IS NULL OR absolute_price > 0);

-- Phase 2: Auto-update stock status
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity = 0 THEN
    NEW.stock_status := 'out_of_stock';
  ELSIF NEW.stock_quantity > 0 AND (OLD.stock_status = 'out_of_stock' OR OLD.stock_status IS NULL) THEN
    NEW.stock_status := 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_stock_status ON products;
CREATE TRIGGER trigger_update_stock_status
BEFORE UPDATE OF stock_quantity ON products
FOR EACH ROW
EXECUTE FUNCTION update_stock_status();

-- Phase 3: Variant Pricing Cleanup
ALTER TABLE product_variants DROP COLUMN IF EXISTS price_adjustment;

-- Phase 4: Stock Tracking & Auditing
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('sale', 'return', 'adjustment', 'restock', 'order', 'cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Admins can view all stock movements" ON stock_movements;
CREATE POLICY "Admins can view all stock movements"
ON stock_movements FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "System can insert stock movements" ON stock_movements;
CREATE POLICY "System can insert stock movements"
ON stock_movements FOR INSERT
WITH CHECK (true);

-- Create trigger to log stock changes
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO stock_movements (
      product_id,
      variant_id,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      notes,
      created_by
    ) VALUES (
      NEW.id,
      NULL,
      NEW.stock_quantity - OLD.stock_quantity,
      OLD.stock_quantity,
      NEW.stock_quantity,
      'adjustment',
      'Stock updated',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_product_stock_movement ON products;
CREATE TRIGGER trigger_log_product_stock_movement
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW
EXECUTE FUNCTION log_stock_movement();

-- Same for variants
CREATE OR REPLACE FUNCTION log_variant_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO stock_movements (
      product_id,
      variant_id,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      notes,
      created_by
    ) VALUES (
      NEW.product_id,
      NEW.id,
      NEW.stock_quantity - OLD.stock_quantity,
      OLD.stock_quantity,
      NEW.stock_quantity,
      'adjustment',
      'Variant stock updated',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_variant_stock_movement ON product_variants;
CREATE TRIGGER trigger_log_variant_stock_movement
AFTER UPDATE OF stock_quantity ON product_variants
FOR EACH ROW
EXECUTE FUNCTION log_variant_stock_movement();

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_stock_movements_product_id;
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);

DROP INDEX IF EXISTS idx_stock_movements_created_at;
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);