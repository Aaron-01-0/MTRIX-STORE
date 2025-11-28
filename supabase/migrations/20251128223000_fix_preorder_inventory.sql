CREATE OR REPLACE FUNCTION reserve_inventory(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
  v_current_stock int;
  v_stock_status text;
BEGIN
  -- Loop through each item in the order
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::uuid;
    v_variant_id := (item->>'variant_id')::uuid; -- Can be null
    v_quantity := (item->>'quantity')::int;

    -- Check Product Stock Status (Preorder check)
    SELECT stock_status INTO v_stock_status
    FROM products
    WHERE id = v_product_id;

    -- IF PREORDER, SKIP INVENTORY CHECK
    IF v_stock_status = 'preorder' THEN
        CONTINUE;
    END IF;

    -- If variant exists, check and update variant stock
    IF v_variant_id IS NOT NULL THEN
      -- Lock the variant row for update
      SELECT stock_quantity INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Variant not found: %', v_variant_id;
      END IF;

      IF v_current_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
      END IF;

      -- Decrement stock
      UPDATE product_variants
      SET stock_quantity = stock_quantity - v_quantity
      WHERE id = v_variant_id;

    ELSE
      -- Check and update product stock (for products without variants or main stock)
      -- Lock the product row for update
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = v_product_id
      FOR UPDATE;

      IF v_current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', v_product_id;
      END IF;

      IF v_current_stock < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
      END IF;

      -- Decrement stock
      UPDATE products
      SET stock_quantity = stock_quantity - v_quantity
      WHERE id = v_product_id;
    END IF;
  END LOOP;
END;
$$;
