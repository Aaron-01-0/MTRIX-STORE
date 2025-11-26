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

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const today = new Date();
        const launchDate = new Date("2024-12-25T00:00:00");
        const diffTime = Math.abs(launchDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Logic:
        // - If > 7 days left: Send only on Mondays (Weekly)
        // - If <= 7 days left: Send daily
        // - If Launch Day: Send Launch Email

        const isMonday = today.getDay() === 1;
        const isHypeWeek = diffDays <= 7 && diffDays > 0;
        const isLaunchDay = diffDays === 0 || (today.getDate() === 25 && today.getMonth() === 11);

        let shouldSend = false;
        let subject = "";
        let content = "";

        if (isLaunchDay) {
            shouldSend = true;
            subject = "THE PORTAL IS OPEN 🟢";
            content = `
        <h1>WE ARE LIVE.</h1>
        <p>The wait is over. Enter the MTRIX.</p>
        <a href="https://mtrix.store" style="background: #0f0; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold;">ENTER NOW</a>
      `;
        } else if (isHypeWeek) {
            shouldSend = true;
            subject = `⚠️ ${diffDays} DAYS LEFT`;
            content = `
        <h1>The countdown accelerates.</h1>
        <p>Only ${diffDays} days remain until the breach.</p>
        <p>Prepare yourself.</p>
      `;
        } else if (isMonday) {
            shouldSend = true;
            subject = "MTRIX Status Update";
            content = `
        <h1>System Loading...</h1>
        <p>We are ${diffDays} days away from launch.</p>
        <p>Stay tuned for more updates.</p>
      `;
        }

        if (!shouldSend) {
            return new Response(JSON.stringify({ message: "No email scheduled for today." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Fetch subscribers
        const { data: subscribers, error: dbError } = await supabase
            .from("launch_subscribers")
            .select("email")
            .eq("status", "subscribed");

        if (dbError) throw dbError;

        if (!subscribers || subscribers.length === 0) {
            return new Response(JSON.stringify({ message: "No subscribers found." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Send emails (batching logic omitted for simplicity, but Resend handles arrays)
        // Note: Resend Free tier has limits. For production, batch this.
        const emails = subscribers.map(s => s.email);

        // Send in batches of 50 to be safe
        const batchSize = 50;
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            await resend.emails.send({
                from: "MTRIX <onboarding@resend.dev>",
                to: batch,
                subject: subject,
                html: `
                <div style="font-family: monospace; background-color: #000; color: #0f0; padding: 20px;">
                ${content}
                <br/>
                <p style="font-size: 10px; color: #666;">You are receiving this because you subscribed to MTRIX updates.</p>
                </div>
            `,
            });
        }

        return new Response(JSON.stringify({ message: `Sent emails to ${emails.length} subscribers.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
