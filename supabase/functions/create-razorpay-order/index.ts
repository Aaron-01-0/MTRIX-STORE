import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const authHeader = req.headers.get('Authorization')!;

    // Client for Auth (acting as user)
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for DB (bypassing RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }


    // Rate Limit Check: Max 5 pending orders in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: pendingCount, error: rateLimitError } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('created_at', fifteenMinutesAgo);

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      throw new Error('System busy. Please try again.');
    }

    if (pendingCount && pendingCount >= 5) {
      console.warn(`Rate limit exceeded for user ${user.id}: ${pendingCount} pending orders`);
      throw new Error('You have too many pending orders. Please complete or cancel them before creating a new one.');
    }

    const { shippingAddress, couponCode } = await req.json();

    // Validate shipping address
    if (!shippingAddress?.address_line_1 || !shippingAddress?.city || !shippingAddress?.pincode) {
      console.error('Invalid shipping address:', { userId: user.id, address: shippingAddress });
      throw new Error('Unable to process order. Please check your shipping information.');
    }

    // Fetch user's cart items
    const { data: cartItems, error: cartError } = await supabaseClient
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        variant_id,
        bundle_id,
        products:product_id (
          id,
          name,
          base_price,
          discount_price,
          stock_quantity
        ),
        bundles:bundle_id (
          id,
          price_type,
          price_value
        )
      `)
      .eq('user_id', user.id);

    if (cartError) {
      console.error('Failed to fetch cart items:', { userId: user.id, error: cartError });
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      console.error('Cart is empty for user:', user.id);
      throw new Error('Unable to process order. Your cart is empty.');
    }

    // Server-side validation: Recalculate total from actual product prices
    let calculatedTotal = 0;
    const inventoryItems = [];

    // Group items for bundle calculation
    const bundleGroups: Record<string, { bundle: any, items: any[], totalItemPrice: number }> = {};
    const standaloneItems = [];

    for (const item of cartItems) {
      const product = item.products;

      // Prepare item for inventory reservation
      inventoryItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity
      });

      // Calculate individual item price
      let itemPrice = product.discount_price || product.base_price;

      if (item.variant_id) {
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('absolute_price, price_adjustment')
          .eq('id', item.variant_id)
          .single();

        if (variant) {
          if (variant.absolute_price) {
            itemPrice = variant.absolute_price;
          } else if (variant.price_adjustment) {
            itemPrice = product.base_price + variant.price_adjustment;
          }
        }
      }

      const lineItemTotal = itemPrice * item.quantity;

      if (item.bundle_id && item.bundles) {
        if (!bundleGroups[item.bundle_id]) {
          bundleGroups[item.bundle_id] = {
            bundle: item.bundles,
            items: [],
            totalItemPrice: 0
          };
        }
        bundleGroups[item.bundle_id].items.push(item);
        bundleGroups[item.bundle_id].totalItemPrice += lineItemTotal;
      } else {
        standaloneItems.push({ ...item, price: itemPrice, lineTotal: lineItemTotal });
        calculatedTotal += lineItemTotal;
      }
    }

    // Calculate Bundle Prices
    for (const bundleId in bundleGroups) {
      const group = bundleGroups[bundleId];
      const bundle = group.bundle;

      let bundlePrice = group.totalItemPrice;
      const bundleQty = group.items[0]?.quantity || 1;

      if (bundle.price_type === 'fixed') {
        bundlePrice = bundle.price_value * bundleQty;
      } else if (bundle.price_type === 'percentage_discount') {
        bundlePrice = group.totalItemPrice * (1 - bundle.price_value / 100);
      } else if (bundle.price_type === 'fixed_discount') {
        bundlePrice = Math.max(0, group.totalItemPrice - (bundle.price_value * bundleQty));
      }

      calculatedTotal += bundlePrice;
    }

    // Reserve Inventory (Atomic Lock)
    const { error: reservationError } = await supabaseAdmin.rpc('reserve_inventory', {
      p_items: inventoryItems
    });

    if (reservationError) {
      console.error('Inventory reservation failed:', reservationError);
      throw new Error('Some items in your cart are no longer available.');
    }

    // --- COUPON LOGIC ---
    let discountAmount = 0;
    let appliedCouponCode = null;
    let isFreeShipping = false;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (!couponError && coupon) {
        // Check validity
        const now = new Date();
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (validUntil && validUntil < now) {
          console.log('Coupon expired');
        } else if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
          console.log('Coupon usage limit reached');
        } else if (calculatedTotal < coupon.min_order_value) {
          console.log('Min order value not met');
        } else {
          // Apply discount
          if (coupon.discount_type === 'percentage') {
            let discount = calculatedTotal * (coupon.discount_value / 100);
            if (coupon.max_discount_amount) {
              discount = Math.min(discount, coupon.max_discount_amount);
            }
            discountAmount = discount;
          } else if (coupon.discount_type === 'fixed') {
            discountAmount = coupon.discount_value;
          } else if (coupon.discount_type === 'free_shipping') {
            isFreeShipping = true;
          }
          appliedCouponCode = couponCode;
        }
      }
    }

    // Fetch shipping settings
    const { data: settingsData } = await supabaseAdmin
      .from('support_settings')
      .select('shipping_cost, free_shipping_threshold')
      .single();

    const shippingCost = settingsData?.shipping_cost ?? 50;
    const freeShippingThreshold = settingsData?.free_shipping_threshold ?? 499;

    // Calculate shipping
    const shippingAmount = (calculatedTotal >= freeShippingThreshold || isFreeShipping) ? 0 : shippingCost;

    // Final Calculation
    calculatedTotal = calculatedTotal + shippingAmount - discountAmount;

    // Ensure total is not negative
    calculatedTotal = Math.max(0, calculatedTotal);

    // Round to avoid decimal issues
    calculatedTotal = Math.round(calculatedTotal);

    console.log('Creating order with validated total:', calculatedTotal, 'Discount:', discountAmount);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order in database (Use Admin)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: calculatedTotal,
        shipping_address: shippingAddress,
        status: 'pending',
        payment_status: 'pending',
        coupon_code: appliedCouponCode,
        discount_amount: discountAmount
      })
      .select()
      .single();

    if (orderError) {
      // ROLLBACK INVENTORY
      console.error('Order creation failed, rolling back inventory...');
      await supabaseAdmin.rpc('release_inventory', { p_items: inventoryItems });
      throw orderError;
    }

    // Insert order items (Use Admin)
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.products.discount_price || item.products.base_price,
      variant_id: item.variant_id
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Razorpay order
    const razorpayOrderData = {
      amount: calculatedTotal * 100, // Convert to paise
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        order_id: order.id,
        user_id: user.id
      }
    };

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(razorpayOrderData)
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', { status: razorpayResponse.status, error: errorText, orderId: order.id });
      throw new Error('Payment service temporarily unavailable. Please try again.');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Create payment transaction record (Use Admin)
    const { error: txError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        razorpay_order_id: razorpayOrder.id,
        amount: calculatedTotal,
        currency: 'INR',
        status: 'created'
      });

    if (txError) {
      console.error('Failed to create payment transaction:', txError);
      throw txError;
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        orderNumber: orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: calculatedTotal,
        currency: 'INR',
        razorpayKeyId: razorpayKeyId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in create-razorpay-order:', error);

    // Return generic error message to client, log details server-side
    const genericMessage = error.message && error.message.startsWith('Unable to process order')
      ? error.message
      : 'Unable to process your order at this time. Please try again.';

    return new Response(
      JSON.stringify({
        error: genericMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
