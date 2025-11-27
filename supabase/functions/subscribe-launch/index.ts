import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'https://esm.sh/react@18.2.0';
import { render } from 'https://esm.sh/@react-email/render@0.0.10';
import { WelcomeEmail } from './_templates/WelcomeEmail.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

        const emailHtml = render(React.createElement(WelcomeEmail, { email }));

        const { data, error } = await resend.emails.send({
            from: "MTRIX <onboarding@resend.dev>",
            to: [email],
            subject: "Welcome to the Resistance",
            html: emailHtml,
        });

        if (error) {
            console.error("Resend error:", error);
            throw error;
        }

        return new Response(JSON.stringify(data), {
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
