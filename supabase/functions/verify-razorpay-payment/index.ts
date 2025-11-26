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
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const authHeader = req.headers.get('Authorization')!;

    // Client for Auth verification (acting as user)
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for Database operations (bypassing RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed in verify-razorpay-payment:', authError);
      throw new Error('Authentication required');
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac('sha256', razorpayKeySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature:', {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        userId: user.id
      });
      throw new Error('Payment could not be verified. Please contact support if amount was deducted.');
    }

    console.log('Payment signature verified successfully');

    // Update payment transaction
    const { error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'success'
      })
      .eq('order_id', orderId)
      .eq('razorpay_order_id', razorpay_order_id);

    if (transactionError) throw transactionError;

    // Update order status
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'success',
        status: 'order_created',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature
      })
      .eq('id', orderId)
      .eq('user_id', user.id); // Ensure user owns the order

    if (orderError) throw orderError;

    // Clear user's cart
    const { error: cartError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (cartError) {
      console.error('Failed to clear cart:', cartError);
      // Non-critical error, don't throw
    }

    // Trigger Order Confirmation Email (Fire and forget or await)
    try {
      console.log('Triggering order confirmation email for order:', orderId);
      await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}` // Use service role key to bypass auth checks in the target function if needed, or pass user token
        },
        body: JSON.stringify({ order_id: orderId })
      });
    } catch (emailError) {
      console.error('Failed to trigger order confirmation email:', emailError);
      // Don't fail the request, just log it
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in verify-razorpay-payment:', error);

    // Return generic error message to client, log details server-side
    // Return specific error message for debugging
    const genericMessage = error.message || 'Payment verification failed.';

    return new Response(
      JSON.stringify({
        success: false,
        error: genericMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
