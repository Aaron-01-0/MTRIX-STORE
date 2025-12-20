import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.21.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { email, otp } = body;

        console.log("Verifying OTP for:", email, "Code:", otp);

        if (!email || !otp) {
            return new Response(JSON.stringify({ valid: false, message: "Email and OTP are required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Verify OTP - Explicitly checking for errors
        const { data, error } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('email', email)
            .eq('otp', otp)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // Use maybeSingle to avoid error on 0 rows, but we will check data

        if (error) {
            console.error("Supabase Error:", error);
            return new Response(JSON.stringify({ valid: false, message: `DB Error: ${error.message}` }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (!data) {
            console.log("No matching OTP found or expired");
            return new Response(JSON.stringify({ valid: false, message: "Invalid or expired OTP" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Mark as verified
        const { error: updateError } = await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('id', data.id);

        if (updateError) {
            return new Response(JSON.stringify({ valid: false, message: "Failed to mark as verified" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Add to main subscriber list if not exists
        // Add to main subscriber list if not exists
        const { error: insertError } = await supabase
            .from('launch_subscribers')
            .insert([{ email }]);

        if (insertError) {
            console.log("Subscriber insert error (ignore if duplicate):", insertError);
        } else {
            // Trigger Welcome Email / Subscribe Launch
            try {
                // Construct Functions URL (Local vs Prod)
                // SUPABASE_URL is like https://xyz.supabase.co
                const functionsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/subscribe-launch`;

                console.log("Triggering welcome email to:", email);

                fetch(functionsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
                    },
                    body: JSON.stringify({ email })
                }).catch(err => console.error("Background email trigger failed:", err));

            } catch (emailErr) {
                console.error("Failed to init welcome email:", emailErr);
            }
        }

        return new Response(JSON.stringify({ valid: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Unexpected Error:", error);
        // Return 200 so the frontend can read the error message
        return new Response(JSON.stringify({ valid: false, message: `Server Error: ${error.message}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
