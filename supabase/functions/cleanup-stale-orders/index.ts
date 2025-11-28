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
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Use Service Role Key for admin access

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // Calculate cutoff time (4 hours ago)
        const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

        // Find stale pending orders
        const { data: staleOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id, order_items(product_id, variant_id, quantity)')
            .eq('status', 'pending')
            .lt('created_at', cutoffTime);

        if (fetchError) throw fetchError;

        if (!staleOrders || staleOrders.length === 0) {
            return new Response(JSON.stringify({ message: 'No stale orders found', count: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        console.log(`Found ${staleOrders.length} stale orders to cancel.`);

        const results = [];

        for (const order of staleOrders) {
            try {
                // 1. Update order status
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update({ status: 'cancelled', payment_status: 'failed' })
                    .eq('id', order.id);

                if (updateError) throw updateError;

                // 2. Release inventory
                const inventoryItems = order.order_items.map((item: any) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity
                }));

                const { error: releaseError } = await supabaseAdmin.rpc('release_inventory', {
                    p_items: inventoryItems
                });

                if (releaseError) {
                    console.error(`Failed to release inventory for order ${order.id}:`, releaseError);
                }

                // 3. Update payment transaction if exists
                await supabaseAdmin
                    .from('payment_transactions')
                    .update({ status: 'failed' })
                    .eq('order_id', order.id);

                results.push({ id: order.id, status: 'cancelled' });

            } catch (err: any) {
                console.error(`Failed to cancel order ${order.id}:`, err);
                results.push({ id: order.id, status: 'error', error: err.message });
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Error in cleanup-stale-orders:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
