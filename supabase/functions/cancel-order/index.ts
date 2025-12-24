import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

        const { orderId } = await req.json();

        if (!orderId) {
            throw new Error('Missing orderId');
        }

        // Fetch order to verify ownership and get items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
        *,
        order_items (
          product_id,
          variant_id,
          quantity
        )
      `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            throw new Error('Order not found');
        }

        if (order.user_id !== user.id) {
            throw new Error('Unauthorized access to order');
        }

        if (order.status !== 'pending') {
            // If already cancelled or paid, just return success
            return new Response(JSON.stringify({ success: true, message: 'Order already processed' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Update order status to cancelled
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'failed' })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Release Inventory
        const inventoryItems = order.order_items.map((item: any) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity
        }));

        const { error: releaseError } = await supabaseAdmin.rpc('release_inventory', {
            p_items: inventoryItems
        });

        if (releaseError) {
            console.error('Failed to release inventory for cancelled order:', releaseError);
            // Don't fail the request, just log it. The order is already cancelled.
        }

        // Update payment transaction if exists
        await supabaseAdmin
            .from('payment_transactions')
            .update({ status: 'failed' })
            .eq('order_id', orderId);

        // Restore Coupon Usage if applicable
        if (order.coupon_code) {
            await supabaseAdmin.rpc('restore_coupon_usage', {
                p_code: order.coupon_code,
                p_user_id: user.id
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Error cancelling order:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
