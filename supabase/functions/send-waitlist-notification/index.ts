import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
    waitlistId: string;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { waitlistId }: NotifyRequest = await req.json();

        if (!waitlistId) {
            return new Response(JSON.stringify({ error: "Waitlist ID is required." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Fetch Waitlist Entry
        const { data: entry, error: fetchError } = await supabase
            .from("drop_waitlist")
            .select(`
                *,
                drops (
                    title,
                    price,
                    image_url
                )
            `)
            .eq("id", waitlistId)
            .single();

        if (fetchError || !entry) {
            throw new Error("Waitlist entry not found");
        }

        const dropTitle = entry.drops?.title || "Exclusive Drop";
        const email = entry.email;

        // 2. Generate Email Content
        const subject = `The Wait is Over: ${dropTitle} is Here!`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1>Good News!</h1>
                <p>The item you have been waiting for, <strong>${dropTitle}</strong>, is now available.</p>
                <p>Don't miss out - secure yours before it's gone again.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mtrix.store/products" style="background-color: #000; color: #FFD700; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Shop Now
                    </a>
                </div>
                <p style="font-size: 12px; color: #666;">You received this because you signed up for the waitlist at mtrix.store.</p>
            </div>
        `;

        // 3. Send Email
        const { data, error } = await resend.emails.send({
            from: "MTRIX <hello@mtrix.store>",
            to: [email],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("Resend Error:", error);
            throw new Error(`Resend API Error: ${error.message || JSON.stringify(error)}`);
        }

        // 4. Update Status
        const { error: updateError } = await supabase
            .from("drop_waitlist")
            .update({ status: 'notified' })
            .eq("id", waitlistId);

        if (updateError) console.error("Failed to update status:", updateError);

        return new Response(JSON.stringify({ success: true, message: `Notification sent to ${email}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
