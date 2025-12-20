import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.21.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { email } = await req.json();

        if (!email) {
            throw new Error("Email is required");
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // Store in DB
        const { error: dbError } = await supabase
            .from('otp_verifications')
            .insert({ email, otp, expires_at: expiresAt });

        if (dbError) throw dbError;

        // Send Email
        const { data, error } = await resend.emails.send({
            from: "MTRIX <noa@mtrix.store>",
            to: [email],
            subject: "Your MTRIX Verification Code",
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; background: #000; color: #fff; border: 1px solid #333; text-align: center;">
                    <h1 style="color: #D4AF37; margin-bottom: 20px;">MTRIX</h1>
                    <p style="color: #aaa;">Your verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; color: #fff;">
                        ${otp}
                    </div>
                    <p style="color: #666; font-size: 12px;">This code expires in 10 minutes.</p>
                </div>
            `,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
