import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
    order_id: string;
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const supabaseClient = createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        // 2. Verify Admin Role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
        });

        if (!isAdmin) {
            throw new Error("Admin access required");
        }

        // 3. Parse Request
        const { order_id }: RequestBody = await req.json();
        if (!order_id) throw new Error("Order ID is required");

        // 4. Fetch Order Details with Items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    price,
                    products (
                        name
                    )
                )
            `)
            .eq('id', order_id)
            .single();

        if (orderError) {
            console.error("Error fetching order:", orderError);
            throw new Error("Error fetching order: " + orderError.message);
        }
        if (!order) throw new Error("Order not found");

        // Fetch Profile
        let userProfile = null;
        if (order.user_id) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name, name')
                .eq('user_id', order.user_id)
                .maybeSingle();
            userProfile = profile;
        }

        // Attach profile to order object for compatibility with existing logic
        (order as any).user = userProfile;

        // 5. Fetch or Generate Invoice
        let { data: invoice } = await supabaseAdmin
            .from('invoices')
            .select('pdf_url, invoice_number')
            .eq('order_id', order_id)
            .maybeSingle();

        if (!invoice || !invoice.pdf_url) {
            console.log("Invoice not found, generating...");
            // Invoke generate-invoice
            const { data: genData, error: genError } = await supabaseAdmin.functions.invoke('generate-invoice', {
                body: { order_id }
            });

            if (genError) throw genError;

            // Re-fetch invoice
            const { data: newInvoice, error: fetchError } = await supabaseAdmin
                .from('invoices')
                .select('pdf_url, invoice_number')
                .eq('order_id', order_id)
                .single();

            if (fetchError || !newInvoice) throw new Error("Failed to generate invoice");
            invoice = newInvoice;
        }

        // 6. Prepare Email
        let customerEmail = order.user?.email;

        // If email not in profile (likely), fetch from auth.users
        if (!customerEmail && order.user_id) {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
            if (!userError && userData.user) {
                customerEmail = userData.user.email;
            }
        }

        // Fallback to shipping address email if available
        if (!customerEmail && order.shipping_address && (order.shipping_address as any).email) {
            customerEmail = (order.shipping_address as any).email;
        }

        if (!customerEmail) {
            console.error("Could not find email for order:", order_id);
            throw new Error("Customer email not found");
        }

        const customerName = order.user?.full_name || order.user?.name || (order.shipping_address as any)?.name || "Valued Customer";
        const timestamp = new Date().getTime();
        const invoiceUrl = `${invoice.pdf_url}?t=${timestamp}`;
        const invoiceNumber = invoice.invoice_number || `INV-${order.order_number}`;
        const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const paymentStatus = order.payment_status ? (order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)) : 'Pending';

        // Generate Items List HTML
        const itemsListHtml = order.order_items ? order.order_items.map((item: any) =>
            `<div style="margin-bottom: 8px;">• ${item.quantity}× ${item.products?.name || 'Product'} — ₹${item.price}</div>`
        ).join('') : '';

        const subject = `✨ Your MTRIX Invoice for Order #${order.order_number} is Here`;

        const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 2px;">MTRIX</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #e0e0e0;">Hey <strong style="color: #fff;">${customerName}</strong>,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Thank you for choosing MTRIX.<br>
        Your order has been confirmed, and the invoice for Order <strong style="color: #fff;">#${order.order_number}</strong> is attached below.</p>
        
        <div style="background: #111; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #D4AF37; margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 10px;">🧾 Order Snapshot</h3>
            <p style="font-size: 14px; line-height: 1.8; color: #ccc; margin-bottom: 0;">
                • Order ID: <strong style="color: #fff;">${order.order_number}</strong><br>
                • Placed On: <strong style="color: #fff;">${orderDate}</strong><br>
                • Payment Status: <strong style="color: #fff;">${paymentStatus}</strong><br>
                • Order Total: <strong style="color: #D4AF37;">₹${order.total_amount}</strong>
            </p>
        </div>

        <div style="margin: 30px 0;">
            <h3 style="color: #D4AF37; margin-top: 0; margin-bottom: 15px;">🛍 What You Picked</h3>
            <div style="font-size: 14px; line-height: 1.6; color: #ccc;">
                ${itemsListHtml}
            </div>
            <p style="font-style: italic; color: #888; margin-top: 15px; font-size: 14px;">Your choices say you’ve got taste…</p>
        </div>
        
        <div style="background: #111; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #D4AF37; margin-top: 0; margin-bottom: 15px;">📁 Included in This Email</h3>
             <div style="text-align: center; margin-top: 20px;">
                <a href="${invoiceUrl}" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">✔ Download Invoice (PDF)</a>
            </div>
             <p style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
                If the button doesn't work: <a href="${invoiceUrl}" style="color: #D4AF37;">${invoiceUrl}</a>
            </p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center; font-size: 12px; color: #666;">
          © 2025 MTRIX Store. All rights reserved.
        </div>
      </div>
    `;

        // 7. Send Email
        const emailResponse = await resend.emails.send({
            from: "MTRIX <onboarding@resend.dev>",
            to: [customerEmail],
            subject: subject,
            html: html,
        });

        return new Response(JSON.stringify({ success: true, data: emailResponse }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error sending invoice email:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 to ensure client receives the error message
        });
    }
};

serve(handler);
