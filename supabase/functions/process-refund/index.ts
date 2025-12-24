import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { payment_id, amount } = await req.json()
        const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
        const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials not configured')
        }

        console.log(`Processing refund for payment: ${payment_id}, amount: ${amount}`)

        // 1. Call Razorpay Refund API
        const response = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET)
            },
            body: JSON.stringify({
                amount: amount * 100, // Razorpay expects amount in paise
                speed: 'normal'
            })
        })

        const refundData = await response.json()

        if (!response.ok) {
            console.error('Razorpay refund failed:', refundData)
            throw new Error(refundData.error?.description || 'Failed to process refund with Razorpay')
        }

        console.log('Razorpay refund successful:', refundData)

        // 2. Update database
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Update payment transaction status
        const { error: dbError } = await supabase
            .from('payment_transactions')
            .update({
                status: 'refunded',
                updated_at: new Date().toISOString()
            })
            .eq('razorpay_payment_id', payment_id)

        if (dbError) {
            console.error('Database update failed:', dbError)
            // We don't throw here because the refund was actually successful
        }

        // Also update the order payment status if linked
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('id, order_id')
            .eq('razorpay_payment_id', payment_id)
            .single()

        if (transaction) {
            // 1. Update Order Status
            if (transaction.order_id) {
                await supabase
                    .from('orders')
                    .update({ payment_status: 'refunded' })
                    .eq('id', transaction.order_id)
            }

            // 2. Create Refund Record
            const { error: refundError } = await supabase
                .from('refunds')
                .insert({
                    payment_id: transaction.id,
                    order_id: transaction.order_id,
                    amount: amount,
                    reason: 'Admin initiated refund',
                    status: 'processed',
                    gateway_refund_id: refundData.id
                });

            if (refundError) console.error('Failed to create refund record:', refundError);

            // 3. Create Audit Log
            await supabase
                .from('audit_logs')
                .insert({
                    action: 'refund_processed',
                    entity_type: 'payment',
                    entity_id: transaction.id,
                    details: {
                        amount: amount,
                        gateway_refund_id: refundData.id,
                        reason: 'Admin initiated refund'
                    }
                });

            // 4. Restore Coupon Usage
            const { data: orderData } = await supabase
                .from('orders')
                .select('coupon_code, user_id')
                .eq('id', transaction.order_id)
                .single();

            if (orderData?.coupon_code && orderData?.user_id) {
                await supabase.rpc('restore_coupon_usage', {
                    p_code: orderData.coupon_code,
                    p_user_id: orderData.user_id
                });
            }
        }

        return new Response(
            JSON.stringify({ success: true, refund: refundData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error in process-refund:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
