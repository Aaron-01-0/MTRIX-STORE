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

interface BroadcastRequest {
    subject: string;
    content: string; // HTML content
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { subject, content }: BroadcastRequest = await req.json();

        if (!subject || !content) {
            return new Response(JSON.stringify({ error: "Subject and content are required." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Fetch subscribers
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

        const emails = subscribers.map(s => s.email);
        const recipientCount = emails.length;
        // 2. Send emails (Batching)
        const batchSize = 50;
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            const { data, error } = await resend.emails.send({
                from: "MTRIX <hello@mtrix.store>",
                to: ["hello@mtrix.store"],
                bcc: batch,
                subject: subject,
                html: content,
            });

            if (error) {
                console.error("Resend Error:", error);
                throw new Error(`Resend API Error: ${error.message || JSON.stringify(error)}`);
            }
        }

        // 3. Log to broadcasts table
        const { error: logError } = await supabase
            .from("broadcasts")
            .insert([{
                subject,
                content,
                recipient_count: recipientCount,
                status: 'sent'
            }]);

        if (logError) console.error("Failed to log broadcast:", logError);

        return new Response(JSON.stringify({ message: `Broadcast sent to ${recipientCount} subscribers.` }), {
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
