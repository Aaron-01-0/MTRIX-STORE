-- Function to calculate and update parent product stock
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock for the product associated with the NEW variant (Insert/Update)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE products
    SET stock_quantity = (
      SELECT COALESCE(SUM(stock_quantity), 0)
      FROM product_variants
      WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
  END IF;

  -- Update stock for the product associated with the OLD variant (Delete or Update where product_id changed)
  IF (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id)) THEN
    UPDATE products
    SET stock_quantity = (
      SELECT COALESCE(SUM(stock_quantity), 0)
      FROM product_variants
      WHERE product_id = OLD.product_id
    )
    WHERE id = OLD.product_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_variant_stock_change ON product_variants;

CREATE TRIGGER on_variant_stock_change
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock();
