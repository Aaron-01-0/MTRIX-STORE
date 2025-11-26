import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  email: string;
  type: 'placed' | 'confirmed' | 'shipped' | 'delivered';
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  customerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create client with user's JWT for auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, type, orderNumber, trackingNumber, trackingUrl, customerName }: OrderEmailRequest = await req.json();

    console.log("Admin user sending order email:", { userId: user.id, orderNumber, type });

    let subject = '';
    let html = '';
    let text = '';

    const commonStyle = `
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #000000;
      color: #cccccc;
      padding: 20px;
    `;
    const containerStyle = `
      background-color: #111111;
      padding: 40px;
      border-radius: 8px;
      border: 1px solid #333;
    `;
    const headingStyle = `
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px;
      text-align: center;
    `;
    const goldTextStyle = `
      color: #D4AF37;
      font-weight: bold;
    `;
    const boxStyle = `
      margin: 30px 0;
      padding: 20px;
      background-color: #222222;
      border-radius: 4px;
      text-align: center;
    `;
    const linkStyle = `
      color: #D4AF37;
      text-decoration: none;
      font-weight: bold;
    `;

    const footerHtml = `
      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
        © 2024 MTRIX. All rights reserved.
      </p>
      <div style="text-align: center; margin-top: 20px;">
        <img src="https://tguflnxyewjuuzckcemo.supabase.co/storage/v1/object/public/assets/ezgif-7bee47465acb1993.gif" alt="Matrix Rain" width="100%" height="50" style="object-fit: cover; border-radius: 4px; opacity: 0.5;" />
      </div>
    `;

    switch (type) {
      case 'placed':
        subject = `Order Confirmed - ${orderNumber}`;
        text = `Thank You for Your Order!\n\nHi ${customerName || 'Valued Customer'},\n\nWe've received your order ${orderNumber} and it's being processed.\n\nWe'll send you another email once your order has been confirmed and is ready to ship.\n\nOrder Number: ${orderNumber}\n\n© 2024 MTRIX. All rights reserved.`;
        html = `
          <div style="${commonStyle}">
            <div style="${containerStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">MTRIX</span>
              </div>
              <h1 style="${headingStyle}">Thank You for Your Order!</h1>
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <p>We've received your order <strong style="${goldTextStyle}">${orderNumber}</strong> and it's being processed.</p>
              <p>We'll send you another email once your order has been confirmed and is ready to ship.</p>
              <div style="${boxStyle}">
                <h3 style="margin: 0; color: #fff;">Order Number: <span style="${goldTextStyle}">${orderNumber}</span></h3>
              </div>
              ${footerHtml}
            </div>
          </div>
        `;
        break;

      case 'confirmed':
        subject = `Order Confirmed - ${orderNumber}`;
        text = `Your Order Has Been Confirmed!\n\nHi ${customerName || 'Valued Customer'},\n\nGreat news! Your order ${orderNumber} has been confirmed and will be shipped soon.\n\nOrder Number: ${orderNumber}\n\nWe'll notify you once your order has been shipped with tracking details.\n\n© 2024 MTRIX. All rights reserved.`;
        html = `
          <div style="${commonStyle}">
            <div style="${containerStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">MTRIX</span>
              </div>
              <h1 style="${headingStyle}">Your Order Has Been Confirmed!</h1>
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <p>Great news! Your order <strong style="${goldTextStyle}">${orderNumber}</strong> has been confirmed and will be shipped soon.</p>
              <div style="${boxStyle}">
                <h3 style="margin: 0; color: #fff;">Order Number: <span style="${goldTextStyle}">${orderNumber}</span></h3>
              </div>
              <p>We'll notify you once your order has been shipped with tracking details.</p>
              ${footerHtml}
            </div>
          </div>
        `;
        break;

      case 'shipped':
        subject = `Order Shipped - ${orderNumber}`;
        text = `Your Order Has Been Shipped!\n\nHi ${customerName || 'Valued Customer'},\n\nYour order ${orderNumber} is on its way!\n\nTracking Information:\nTracking Number: ${trackingNumber || 'N/A'}\n${trackingUrl ? `Track Your Order: ${trackingUrl}` : ''}\n\nYour order will arrive soon. Thank you for shopping with MTRIX!\n\n© 2024 MTRIX. All rights reserved.`;
        html = `
          <div style="${commonStyle}">
            <div style="${containerStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">MTRIX</span>
              </div>
              <h1 style="${headingStyle}">Your Order Has Been Shipped!</h1>
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <p>Your order <strong style="${goldTextStyle}">${orderNumber}</strong> is on its way!</p>
              <div style="${boxStyle}">
                <h3 style="margin-bottom: 10px; color: #fff;">Tracking Information</h3>
                <p style="margin: 5px 0;">Tracking Number: <span style="color: #fff;">${trackingNumber || 'N/A'}</span></p>
                ${trackingUrl ? `<p style="margin-top: 15px;"><a href="${trackingUrl}" style="${linkStyle}">Track Your Order</a></p>` : ''}
              </div>
              <p>Your order will arrive soon. Thank you for shopping with MTRIX!</p>
              ${footerHtml}
            </div>
          </div>
        `;
        break;

      case 'delivered':
        subject = `Order Delivered - ${orderNumber}`;
        text = `Your Order Has Been Delivered!\n\nHi ${customerName || 'Valued Customer'},\n\nYour order ${orderNumber} has been successfully delivered!\n\nOrder Number: ${orderNumber}\n\nWe hope you love your MTRIX products! If you have any questions, please contact us.\n\n© 2024 MTRIX. All rights reserved.`;
        html = `
          <div style="${commonStyle}">
            <div style="${containerStyle}">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">MTRIX</span>
              </div>
              <h1 style="${headingStyle}">Your Order Has Been Delivered!</h1>
              <p>Hi ${customerName || 'Valued Customer'},</p>
              <p>Your order <strong style="${goldTextStyle}">${orderNumber}</strong> has been successfully delivered!</p>
              <div style="${boxStyle}">
                <h3 style="margin: 0; color: #fff;">Order Number: <span style="${goldTextStyle}">${orderNumber}</span></h3>
              </div>
              <p>We hope you love your MTRIX products! If you have any questions, please contact us.</p>
              ${footerHtml}
            </div>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "MTRIX <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
      text: text,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);