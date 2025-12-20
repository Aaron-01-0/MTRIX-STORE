import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import React from 'https://esm.sh/react@18.2.0';
import { render } from 'https://esm.sh/@react-email/render@0.0.10';
import { renderToBuffer } from 'https://esm.sh/@react-pdf/renderer@3.1.12';

import { InvoicePdf } from './_templates/InvoicePdf.tsx';
import { OrderEmail } from '../_shared/email-templates/OrderEmail.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // 1. Parse Request Body
        const { order_id } = await req.json();

        if (!order_id) {
            throw new Error("Missing order_id in request body");
        }

        // 2. Fetch Order Details
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id);

        if (orderError) {
            throw new Error(`Database error: ${orderError.message} `);
        }

        if (!orders || orders.length === 0) {
            throw new Error(`Order not found: No order with ID ${order_id} `);
        }

        const order = orders[0];

        // 3. Fetch User Profile for Email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', order.user_id)
            .single();

        // Fallback email if profile fetch fails
        let customerEmail = profile?.email;
        const customerName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''} ` : 'Valued Customer';

        if (!customerEmail) {
            // Try fetching from auth.users using admin API
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);
            if (userError || !userData.user) {
                throw new Error("Could not find user email");
            }
            customerEmail = userData.user.email;
        }

        console.log(`Processing order ${order.order_number} for ${customerEmail}`);

        // 4. Generate PDF Invoice
        // Note: InvoicePdf template is kept local as it is specific to PDF generation
        const pdfBuffer = await renderToBuffer(React.createElement(InvoicePdf, { order: order }));

        // 5. Upload Invoice to Storage
        const fileName = `${order.order_number}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('invoices')
            .upload(fileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true,
                cacheControl: '0'
            });

        if (uploadError) {
            console.error("Error uploading invoice:", uploadError);
        }

        const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);
        console.log("Invoice Public URL:", publicUrl);

        // 6. Generate Email HTML & Text using Shared Template
        const emailHtml = render(React.createElement(OrderEmail, {
            type: 'confirmed',
            orderNumber: order.order_number,
            customerName: customerName
        }));

        const emailText = render(React.createElement(OrderEmail, {
            type: 'confirmed',
            orderNumber: order.order_number,
            customerName: customerName
        }), {
            plainText: true,
        });

        // 7. Send Email via Resend
        const emailResponse = await resend.emails.send({
            from: Deno.env.get("SENDER_EMAIL") || "MTRIX <onboarding@resend.dev>",
            to: [customerEmail],
            subject: `Payment Received — You’re All Set ✔️`,
            html: emailHtml,
            text: emailText,
            attachments: [
                {
                    filename: `Invoice - ${order.order_number}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        console.log("Email sent:", emailResponse);

        return new Response(JSON.stringify({
            success: true,
            emailId: emailResponse.data?.id,
            invoiceUrl: publicUrl,
            pdfSize: pdfBuffer.length
        }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error: any) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});
