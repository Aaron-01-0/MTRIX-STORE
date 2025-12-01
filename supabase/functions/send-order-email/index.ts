import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "npm:resend@2.0.0";
import React from 'https://esm.sh/react@18.2.0';
import { render } from 'https://esm.sh/@react-email/render@0.0.10';
import { OrderEmail } from '../_shared/email-templates/OrderEmail.tsx';

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
  type: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  customerName?: string;
  items?: string[];
  amount?: string;
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

    const { email, type, orderNumber, trackingNumber, trackingUrl, customerName, items, amount }: OrderEmailRequest = await req.json();

    console.log("Admin user sending order email:", { userId: user.id, orderNumber, type });

    let subject = '';
    switch (type) {
      case 'placed': subject = `Your MTRIX Order is Confirmed 🔥`; break;
      case 'confirmed': subject = `Payment Received — You’re All Set ✔️`; break;
      case 'processing': subject = `Your order is being prepared 🛠️`; break;
      case 'shipped': subject = `Your MTRIX Order is on the Way 🚚💨`; break;
      case 'out_for_delivery': subject = `Out for Delivery — It’s Almost There ⚡`; break;
      case 'delivered': subject = `Delivered ✔️ Tell us what you think`; break;
    }

    // Generate Email HTML & Text using React Email
    const emailHtml = render(React.createElement(OrderEmail, {
      type,
      orderNumber,
      customerName,
      trackingNumber,
      trackingUrl,
      items,
      amount
    }));

    const emailText = render(React.createElement(OrderEmail, {
      type,
      orderNumber,
      customerName,
      trackingNumber,
      trackingUrl,
      items,
      amount
    }), {
      plainText: true,
    });

    const emailResponse = await resend.emails.send({
      from: "MTRIX <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: emailHtml,
      text: emailText,
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