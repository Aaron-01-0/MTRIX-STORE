import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-rtb-fingerprint-id",
    "Access-Control-Expose-Headers": "x-rtb-fingerprint-id",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log(`Received ${req.method} request`);
        console.log(`Headers:`, Object.fromEntries(req.headers.entries()));

        const body = await req.text();
        console.log(`Raw Body:`, body);

        if (!body) {
            return new Response(JSON.stringify({ error: "Request body is empty" }), {
                status: 200, // Keep 200 for frontend debugging
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const payload = JSON.parse(body);
        const orderId = payload.record?.id || payload.orderId;

        if (!orderId) {
            return new Response(JSON.stringify({ error: "Order ID is required in payload" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Test Mode
        if (payload.testEmail) {
            console.log(`Sending TEST Order Confirmation to ${payload.testEmail}`);
            await resend.emails.send({
                from: "MTRIX <hello@mtrix.store>",
                to: [payload.testEmail],
                subject: "Order Confirmation #TEST-123",
                html: `
                    <h1>Order Confirmed</h1>
                    <p>Thank you for your purchase!</p>
                    <p><strong>Order ID:</strong> #TEST-123</p>
                    <hr />
                    <p>1x Test Product - $29.99</p>
                    <p><strong>Total:</strong> $29.99</p>
                `
            });
            return new Response(JSON.stringify({ success: true, message: "Test email sent" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Fetch Order Details with Items and User
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (
                    *,
                    products (
                        name
                    )
                ),
                profiles:user_id (
                    email
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error("Order Fetch Error:", orderError);
            return new Response(JSON.stringify({
                error: "Order fetch failed",
                details: orderError || "No order found with this ID",
                queriedId: orderId,
                found: !!order
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const userEmail = order.profiles?.email;
        // 2. Format HTML
        const currencySymbol = order.currency === 'INR' ? '₹' : '$';

        // Status Logic
        const displayId = order.order_number;
        let subject = `Order Update #${displayId}`;
        let headline = "Order Update";
        let message = "Here is the latest update on your order.";

        switch (order.status) {
            case 'order_created':
            case 'pending':
            case 'paid':
                subject = `Order Confirmation #${displayId}`;
                headline = "Order Confirmed";
                message = "Thank you for your purchase! We've received your order.";
                break;
            case 'processing':
                subject = `We're working on Order #${displayId}`;
                headline = "Processing Order";
                message = "Your order is currently being prepared by our team.";
                break;
            case 'shipped':
            case 'shipping':
                subject = `Order #${displayId} Shipped! 🚀`;
                headline = "On Its Way";
                message = "Good news! Your order has been shipped.";
                break;
            case 'delivered':
                subject = `Order #${displayId} Delivered ✅`;
                headline = "Delivered";
                message = "Your package has arrived! callbacks?";
                break;
            case 'cancelled':
                subject = `Order #${displayId} Cancelled`;
                headline = "Order Cancelled";
                message = "This order has been cancelled as requested.";
                break;
        }

        const itemsHtml = order.order_items.map((item: any) => `
            <div style="border-bottom: 1px solid #333; padding: 15px 0; display: flex; justify-content: space-between;">
                <div>
                    <p style="margin: 0; font-weight: bold; color: #fff;">${item.products?.name || 'Item'}</p>
                    <p style="margin: 5px 0 0; color: #888; font-size: 14px;">Qty: ${item.quantity}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; color: #D4AF37;">${currencySymbol}${item.price}</p>
                </div>
            </div>
        `).join('');

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #0c0c0c; border: 1px solid #333; border-radius: 16px; overflow: hidden; }
                    .header { background: linear-gradient(90deg, #D4AF37 0%, #F5D061 50%, #D4AF37 100%); padding: 2px; }
                    .header-inner { background-color: #000000; padding: 30px; text-align: center; }
                    .logo { color: #D4AF37; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-decoration: none; border: 2px solid #D4AF37; padding: 10px 20px; display: inline-block; }
                    .content { padding: 40px 30px; color: #ffffff; }
                    .h1 { font-size: 28px; margin: 0 0 20px; color: #ffffff; text-align: center; letter-spacing: 1px; }
                    .message { color: #cccccc; text-align: center; margin-bottom: 40px; line-height: 1.6; font-size: 16px; }
                    .order-box { background-color: #1a1a1a; padding: 25px; border-radius: 12px; border: 1px solid #333; }
                    .order-header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
                    .total { font-size: 20px; color: #D4AF37; font-weight: bold; text-align: right; margin-top: 20px; }
                    .footer { text-align: center; padding: 30px; color: #666; font-size: 12px; background-color: #080808; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body style="background-color: #000000; padding: 20px;">
                <div class="container">
                    <div class="header">
                        <div class="header-inner">
                            <span class="logo">MTRIX</span>
                        </div>
                    </div>
                    
                    <div class="content">
                        <h1 class="h1">${headline}</h1>
                        <p class="message">Hi there,<br/>${message}</p>
                        
                        <div class="order-box">
                            <div class="order-header">
                                <span style="color: #888;">Order ID</span>
                                <span style="color: #fff; font-family: monospace;">#${displayId}</span>
                            </div>
                            
                            ${itemsHtml}
                            
                            <div class="total">
                                Total: ${currencySymbol}${order.total_amount}
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <a href="https://mtrix.store" class="btn">View Store</a>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} MTRIX Store. All rights reserved.</p>
                        <p>This is an automated message. Please do not reply directly.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // 3. Send Email
        const { data: resendData, error: resendError } = await resend.emails.send({
            from: "MTRIX <orders@mtrix.store>",
            to: [userEmail],
            subject: subject,
            html: emailHtml,
        });

        if (resendError) {
            console.error("Resend API Error:", resendError);
            return new Response(JSON.stringify({
                error: "Resend API Error",
                details: resendError
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Order confirmation sent to ${userEmail}`,
            resendId: resendData?.id
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error:", error);
        // RETURN 200 to ensure frontend receives the error message body
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
