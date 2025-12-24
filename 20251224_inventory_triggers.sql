-- 20251224_inventory_triggers.sql

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER AS $$
DECLARE
    change_amount INTEGER;
    action_type TEXT;
    description TEXT;
BEGIN
    -- Determine change
    IF (TG_OP = 'INSERT') THEN
        IF NEW.stock_quantity IS NULL THEN
            RETURN NEW;
        END IF;
        change_amount := NEW.stock_quantity;
        action_type := 'initial_stock';
        description := 'Initial stock set during variant creation';
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle Nulls by treating them as 0 for calculation, though stock_quantity should ideally be NOT NULL
        change_amount := COALESCE(NEW.stock_quantity, 0) - COALESCE(OLD.stock_quantity, 0);
        
        IF change_amount = 0 THEN
            RETURN NEW; -- No change in stock
        END IF;

        IF change_amount > 0 THEN
            action_type := 'restock';
            description := 'Manual restock or adjustment';
        ELSE
            action_type := 'deduction';
            description := 'Stock deduction (Order or manual)';
        END IF;
    END IF;

    -- Insert into history
    INSERT INTO public.inventory_history (variant_id, quantity_change, action_type, description, created_at)
    VALUES (NEW.id, change_amount, action_type, description, timezone('utc'::text, now()));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_inventory_change ON public.product_variants;

CREATE TRIGGER on_inventory_change
AFTER INSERT OR UPDATE OF stock_quantity ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.log_inventory_change();
