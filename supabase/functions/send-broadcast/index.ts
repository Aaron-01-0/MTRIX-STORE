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
    segment?: 'subscribers' | 'verified_users' | 'customers';
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { subject, content, testEmail, segment = 'subscribers' }: BroadcastRequest & { testEmail?: string } = await req.json();

        if (!subject || !content) {
            return new Response(JSON.stringify({ error: "Subject and content are required." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let emails: string[] = [];
        let recipientCount = 0;

        if (testEmail) {
            // TEST MODE
            emails = [testEmail];
            recipientCount = 1;
            console.log(`Sending TEST broadcast to ${testEmail}`);
        } else {
            // PRODUCTION MODE: Fetch Users based on Segment
            let rawData: { email: string }[] = [];

            console.log(`Processing broadcast for segment: ${segment}`);

            if (segment === 'verified_users') {
                // All Registered Users (Profiles)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('email')
                    .not('email', 'is', null);

                if (error) {
                    console.error("Error fetching profiles:", error);
                    throw error;
                }
                rawData = data || [];
                console.log(`Found ${rawData.length} verified users`);

            } else if (segment === 'customers') {
                // Users who have placed at least one order
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('user_id');

                if (orderError) {
                    console.error("Error fetching orders:", orderError);
                    throw orderError;
                }

                if (orderData && orderData.length > 0) {
                    const userIds = [...new Set(orderData.map(o => o.user_id))];
                    console.log(`Found ${userIds.length} unique customers`);

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('email')
                        .in('user_id', userIds) // Assuming user_id is the foreign key in profiles
                        .not('email', 'is', null);

                    if (error) {
                        // Fallback: Try querying by 'id' if 'user_id' fails or returns empty unexpectedly
                        console.warn("Error fetching customer profiles with user_id, trying id...", error);
                        const { data: retryData, error: retryError } = await supabase
                            .from('profiles')
                            .select('email')
                            .in('id', userIds)
                            .not('email', 'is', null);

                        if (retryError) throw retryError;
                        rawData = retryData || [];
                    } else {
                        rawData = data || [];
                    }
                }

            } else {
                // Default: Newsletter Subscribers (launch_subscribers)
                const { data, error } = await supabase
                    .from("launch_subscribers")
                    .select("email")
                    .eq("status", "subscribed");

                if (error) {
                    console.error("Error fetching subscribers:", error);
                    throw error;
                }
                rawData = data || [];
                console.log(`Found ${rawData.length} subscribers`);
            }

            if (!rawData || rawData.length === 0) {
                console.log("No recipients found.");
                return new Response(JSON.stringify({ message: `No recipients found for segment: ${segment}` }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            // Deduplicate and filter empty
            emails = [...new Set(rawData.map(r => r.email).filter(e => e && e.includes('@')))];
            recipientCount = emails.length;
            console.log(`Final recipient count after dedupe: ${recipientCount}`);
        }

        // 2. Send emails (Batching)
        const batchSize = 50;
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);
            const { data, error } = await resend.emails.send({
                from: "MTRIX <hello@mtrix.store>",
                to: testEmail ? [testEmail] : ["hello@mtrix.store"],
                bcc: testEmail ? undefined : batch, // Don't confirm to self if testing, or do? sending just to TO if test
                subject: testEmail ? `[TEST] ${subject}` : subject,
                html: content,
            });

            if (error) {
                console.error("Resend Error:", error);
                // Check if it's a rate limit error (usually 429)
                if (JSON.stringify(error).includes("rate limit") || (error as any)?.statusCode === 429) {
                    return new Response(JSON.stringify({ error: "Email rate limit exceeded. Please try again in an hour." }), {
                        status: 429,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
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
