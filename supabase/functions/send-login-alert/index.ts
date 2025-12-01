import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";
import React from 'https://esm.sh/react@18.2.0';
import { render } from 'https://esm.sh/@react-email/render@0.0.10';
import { LoginAlertEmail } from '../_shared/email-templates/LoginAlertEmail.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        // Verify the user calling this function
        const supabaseClient = createClient(
            supabaseUrl,
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
        });

        if (!isAdmin) {
            console.log("User is not admin, skipping alert.");
            return new Response(JSON.stringify({ message: "Not an admin" }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // Get request info
        const { userAgent, ip } = await req.json();

        console.log(`Sending login alert for admin: ${user.email}`);

        const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

        const emailHtml = render(React.createElement(LoginAlertEmail, {
            email: user.email || 'Admin',
            time,
            ip,
            userAgent
        }));

        const emailText = render(React.createElement(LoginAlertEmail, {
            email: user.email || 'Admin',
            time,
            ip,
            userAgent
        }), {
            plainText: true,
        });

        const { data, error } = await resend.emails.send({
            from: "MTRIX Security <security@resend.dev>",
            to: [user.email!],
            subject: "Security Alert: New Admin Login",
            html: emailHtml,
            text: emailText,
        });

        if (error) {
            console.error("Failed to send alert:", error);
            throw error;
        }

        return new Response(JSON.stringify({ success: true, id: data?.id }), {
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
