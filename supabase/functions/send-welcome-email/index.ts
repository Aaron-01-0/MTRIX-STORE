import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendKey || !supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Server Configuration: RESEND_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY is not set.");
    }

    const resend = new Resend(resendKey);
    // const supabase = createClient(supabaseUrl, supabaseServiceKey); // Not strictly needed for this simple email send, but keep if used later.

    const { email, name }: WelcomeRequest = await req.json();

    if (!email) {
        return new Response(JSON.stringify({ error: "Email is required." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Send Email
    const { data, error } = await resend.emails.send({
        from: "MTRIX <hello@send.mtrix.store>",
        to: [email],
        subject: "Welcome to MTRIX",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h1 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">Welcome to MTRIX${name ? `, ${name}` : ''}!</h1>
                    <p style="font-size: 16px;">We are thrilled to have you join our community.</p>
                    <p>At MTRIX, we bring specific products to specific people.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://mtrix.store" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">EXPLORE THE COLLECTION</a>
                    </div>
                </div>
            `,
    });

    if (error) {
        console.error("Resend Error:", error);
        // Check for rate limit in error object or message
        const errorString = JSON.stringify(error);
        const errorMessage = (error as any)?.message || errorString;

        if (errorMessage.toLowerCase().includes("rate limit") || (error as any)?.statusCode === 429) {
            return new Response(JSON.stringify({ error: "Email rate limit exceeded. Please try again in an hour." }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        throw error;
    }

    return new Response(JSON.stringify({ message: "Welcome email sent successfully." }), {
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
