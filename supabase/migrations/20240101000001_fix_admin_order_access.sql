-- Enable RLS on orders and order_items if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Create comprehensive policies for orders
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON orders FOR ALL
USING (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  )
);

-- Create comprehensive policies for order_items
CREATE POLICY "Users can view their own order items"
ON order_items FOR SELECT
USING (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all order items"
ON order_items FOR ALL
USING (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON orders TO service_role;
GRANT ALL ON order_items TO service_role;
