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
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const { orderId } = await req.json();

        // Verify Admin Access
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const supabaseClient = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error('Unauthorized');

        const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();

        if (!roleData) throw new Error('Unauthorized: Admin access required');

        if (!orderId) throw new Error('Order ID is required');

        console.log(`Bypassing payment for Order: ${orderId} by Admin: ${user.id}`);

        // 1. Update Order Status
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                status: 'processing',
                razorpay_payment_id: 'bypass_test_payment',
                razorpay_order_id: 'bypass_test_order'
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // 2. Update Transaction
        await supabaseAdmin
            .from('payment_transactions')
            .update({
                razorpay_payment_id: 'bypass_test_payment',
                status: 'success'
            })
            .eq('order_id', orderId);

        // 3. Generate Invoice (Auto-Invoicing)
        const { data: existingInvoice } = await supabaseAdmin
            .from('invoices')
            .select('id')
            .eq('order_id', orderId)
            .single();

        if (!existingInvoice) {
            const { data: invNum, error: seqError } = await supabaseAdmin.rpc('generate_invoice_number');

            if (invNum) {
                const { data: order } = await supabaseAdmin.from('orders').select('total_amount').eq('id', orderId).single();

                await supabaseAdmin
                    .from('invoices')
                    .insert({
                        order_id: orderId,
                        invoice_number: invNum,
                        total_amount: order?.total_amount || 0,
                        status: 'issued',
                        tax_amount: 0
                    });
                console.log(`Invoice generated: ${invNum}`);
            } else {
                console.error('Failed to generate invoice number:', seqError);
            }
        }

        // 4. Clear Cart
        await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true, message: 'Payment bypassed successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Bypass error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
