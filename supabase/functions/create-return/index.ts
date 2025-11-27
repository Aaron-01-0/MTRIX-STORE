import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { order_id, user_id, items, reason, type, email } = await req.json();

        if (!order_id || !items || !reason || !type || !email) {
            throw new Error("Missing required fields");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify Order Eligibility (e.g., check if order exists and is within return window)
        const { data: order, error: orderError } = await supabaseAdmin
            .from("orders")
            .select("created_at, status")
            .eq("id", order_id)
            .single();

        if (orderError || !order) {
            throw new Error("Order not found");
        }

        // Check 30-day return window
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            throw new Error("Return window has expired (30 days)");
        }

        // 2. Create Return Record
        const { data: returnRecord, error: returnError } = await supabaseAdmin
            .from("returns")
            .insert({
                order_id,
                user_id: user_id || null, // Can be null for guest checkout if we supported it
                items,
                return_reason: reason,
                return_type: type,
                status: "pending"
            })
            .select()
            .single();

        if (returnError) {
            throw returnError;
        }

        // 3. Send Confirmation Email to User
        await resend.emails.send({
            from: "MTRIX Returns <returns@resend.dev>",
            to: [email],
            subject: `Return Request Received - Order #${order_id.slice(0, 8)}`,
            html: `
        <h1>Return Request Received</h1>
        <p>Hi there,</p>
        <p>We have received your return request for Order <strong>#${order_id.slice(0, 8)}</strong>.</p>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>We will review your request and get back to you shortly.</p>
        <p>MTRIX Team</p>
      `
        });

        // 4. Send Alert to Admin (Optional, or just rely on Dashboard)
        // For now, we'll skip admin email to save quota, assuming they check dashboard.

        return new Response(JSON.stringify({ success: true, returnId: returnRecord.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error creating return:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
