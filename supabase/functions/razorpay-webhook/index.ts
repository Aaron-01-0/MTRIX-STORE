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

        const bodyText = await req.text();
        const expectedSignature = createHmac('sha256', webhookSecret)
            .update(bodyText)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            throw new Error('Invalid signature');
        }
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 // Return 400 to let Razorpay know something went wrong? Or 200 to stop retries?
            // Usually 200 is safer to stop retries if it's a logic error, 500 if temporary.
            // But for signature failure, 400 is appropriate.
        });
    }
});
