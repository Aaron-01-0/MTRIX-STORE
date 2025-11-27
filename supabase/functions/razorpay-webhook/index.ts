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
        const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET is not set');
            throw new Error('Server configuration error');
        }

        // 1. Verify Signature
        const signature = req.headers.get('x-razorpay-signature');
        if (!signature) {
            throw new Error('No signature provided');
        }

        const event = await req.json();

        // 2. Handle Events
        const { event: eventType, payload } = event;
        const payment = payload.payment.entity;
        const orderId = payment.notes?.order_id;
        const userId = payment.notes?.user_id;

        console.log(`Received webhook event: ${eventType} for Order: ${orderId}`);

        if (!orderId) {
            console.warn('No order_id found in webhook payload');
            return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
        }

        // Admin client for DB operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        if (eventType === 'payment.captured') {
            // Check current order status
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('status, payment_status')
                .eq('id', orderId)
                .single();

            if (fetchError) {
                console.error('Error fetching order:', fetchError);
                throw fetchError;
            }

            // If already processed, ignore
            if (order.payment_status === 'success' || order.status === 'order_created') {
                console.log('Order already processed, ignoring webhook');
                return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
            }

            // Update Order Status
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'success',
                    status: 'order_created',
                    razorpay_payment_id: payment.id,
                    razorpay_order_id: payment.order_id,
                    razorpay_signature: signature // Webhook signature as proof
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('Failed to update order status:', updateError);
                throw updateError;
            }

            // Update Transaction
            await supabaseAdmin
                .from('payment_transactions')
                .update({
                    razorpay_payment_id: payment.id,
                    status: 'success',
                    razorpay_signature: signature
                })
                .eq('order_id', orderId);

            // Clear Cart (if user ID exists)
            if (userId) {
                await supabaseAdmin
                    .from('cart_items')
                    .delete()
                    .eq('user_id', userId);
            }

            console.log('Order successfully updated via webhook');

        } else if (eventType === 'payment.failed') {
            // Release Inventory
            const { data: order, error: fetchError } = await supabaseAdmin
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

            if (!fetchError && order && order.status === 'pending') {
                // Release Inventory
                const inventoryItems = order.order_items.map((item: any) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity
                }));

                await supabaseAdmin.rpc('release_inventory', {
                    p_items: inventoryItems
                });

                // Mark order as failed
                await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        payment_status: 'failed'
                    })
                    .eq('id', orderId);

                console.log('Order cancelled and inventory released via webhook');
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
