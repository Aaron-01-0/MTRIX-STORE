import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

        const { data, error } = await resend.emails.send({
            from: "MTRIX <onboarding@resend.dev>",
            to: [email],
            subject: "Welcome to the Resistance",
            html: `
        <div style="font-family: monospace; background-color: #000; color: #0f0; padding: 20px;">
          <h1 style="text-align: center;">MTRIX</h1>
          <p>The system has accepted your signal.</p>
          <p>We are currently loading the simulation. The breach is scheduled for <strong>December 25, 2024</strong>.</p>
          <p>You will be notified when the portal opens.</p>
          <br/>
          <p>Stay vigilant.</p>
          <p style="opacity: 0.5;">- The Operator</p>
        </div>
      `,
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
