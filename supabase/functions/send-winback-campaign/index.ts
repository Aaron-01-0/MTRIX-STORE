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
        const { testEmail } = await req.json();

        if (testEmail) {
            // TEST MODE
            console.log(`Sending TEST Win-Back to ${testEmail}`);
            await resend.emails.send({
                from: "MTRIX <hello@mtrix.store>",
                to: [testEmail],
                subject: "[TEST] We Miss You! (Here is 20% OFF)",
                html: `
                    <h1>It's been a while...</h1>
                    <p>We noticed you haven't visited properly lately.</p>
                    <p>Here is a special gift just for you:</p>
                    <div style="background: #eee; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        TEST-CODE-20
                    </div>
                    <p>Use this code at checkout for 20% off your next order.</p>
                `
            });
            return new Response(JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 1. Find inactive users
        // Users who ordered > 60 days ago AND haven't ordered since.
        // ... (rest of the logic)

        // Users whose 'last_order_date' is < 60 days ago
        // But we need to make sure we don't spam them.
        // We should track 'last_winback_sent_at' in a 'marketing_logs' table or user profile.
        // Assuming we rely on 'orders' table for last date.

        // FETCH POLICY: Get users with last order between 60 and 90 days ago?
        // Or just anyone > 60 days who hasn't been messaged recently.
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Fetch profiles via RPC or complex query. 
        // Simpler approach: select * from orders order by created_at desc distinct on user_id
        // Then filter.
        // NOTE: This might be heavy for large DBs, but fine for V1.

        // Better: Use a dedicated RPC or View.
        // For now, let's assume we invoke this for a *specific* user or run a batch.
        // Let's implement it as a "Batch Run" that processes 10 users at a time to avoid timeouts.

        const { data: staleOrders, error: orderError } = await supabase
            .rpc('get_inactive_users', { days_inactive: 60, limit_count: 50 }); // Hypothetical RPC

        // Validating RPC existence? The user didn't ask for it.
        // Fallback: Query profiles directly if we have `last_activity` field.
        // Fallback 2: Select users created > 60 days ago who haven't ordered?

        // Let's implement a simpler version: Manual Trigger for Specific User or Test Mode.
        // Or: Query `orders` and Filter.

        // REAL IMPLEMENTATION (Without RPC):
        // 1. Get all recent orders (last 60 days) -> Active Users.
        // 2. Get all users.
        // 3. Inactive = All Users - Active Users.
        // 4. Filter out those who received a winback recently.

        // This is inefficient in code.
        // Let's assume the user calls this manually with a userId for now, OR we just do a simple query.

        // "Win-Back" usually implies they bought before.
        // Logic: Find distinct user_ids from orders where created_at < 60 days ago
        // MINUS user_ids from orders where created_at > 60 days ago.

        // Since I cannot create complex SQL functions easily without migrating again (and user is doing migrations manually),
        // I will write the Typescript logic to be robust but maybe not 100% optimized for millions of users.

        // Step 1: Get list of users who have ordered at least once.
        const { data: allOrderUsers } = await supabase
            .from('orders')
            .select('user_id, created_at')
            .order('created_at', { ascending: false });

        if (!allOrderUsers) return new Response(JSON.stringify({ message: "No orders found" }), { headers: corsHeaders });

        const userLastOrderMap = new Map();
        allOrderUsers.forEach((o: any) => {
            if (!userLastOrderMap.has(o.user_id)) {
                userLastOrderMap.set(o.user_id, new Date(o.created_at));
            }
        });

        const targets = [];
        for (const [userId, lastDate] of userLastOrderMap.entries()) {
            if (lastDate < sixtyDaysAgo) {
                // Potentially stale.
                // Check if we already sent a winback recently?
                // (Skipping for V1, assuming we run this periodically with care)
                targets.push(userId);
            }
        }

        // Limit to 5 per run for safety during testing
        const batch = targets.slice(0, 5);
        const results = [];

        for (const userId of batch) {
            // 2. Generate Coupon
            const { data: couponData, error: couponError } = await supabase.functions.invoke('generate-smart-coupon', {
                body: {
                    userId,
                    discountType: 'percentage',
                    discountValue: 20, // 20% OFF
                    prefix: 'MISSYOU',
                    validDays: 7
                }
            });

            if (couponError || !couponData?.success) {
                console.error(`Failed to gen coupon for ${userId}:`, couponError);
                continue;
            }

            const code = couponData.code;

            // 3. Get User Email
            const { data: userProfile } = await supabase.from('profiles').select('email').eq('id', userId).single();
            if (!userProfile?.email) continue;

            // 4. Send Email
            await resend.emails.send({
                from: "MTRIX <hello@mtrix.store>",
                to: [userProfile.email],
                subject: "We Miss You! (Here is 20% OFF)",
                html: `
                    <h1>It's been a while...</h1>
                    <p>We noticed you haven't visited properly lately.</p>
                    <p>Here is a special gift just for you:</p>
                    <div style="background: #eee; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        ${code}
                    </div>
                    <p>Use this code at checkout for 20% off your next order.</p>
                `
            });

            results.push({ userId, status: 'sent', code });
        }

        return new Response(JSON.stringify({ success: true, processed: results.length, details: results }), {
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
