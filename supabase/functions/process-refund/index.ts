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
            .select('order_id')
            .eq('razorpay_payment_id', payment_id)
            .single()

        if (transaction?.order_id) {
            await supabase
                .from('orders')
                .update({ payment_status: 'refunded' })
                .eq('id', transaction.order_id)
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
