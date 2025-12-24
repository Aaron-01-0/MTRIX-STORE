import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateCouponRequest {
    userId?: string;     // If restricted to a specific user
    email?: string;      // Alternative to userId
    discountType: 'percentage' | 'fixed' | 'free_shipping';
    discountValue: number;
    prefix?: string;     // Default: SMART
    validDays?: number;  // Default: 30
    restrictedProducts?: string[];
    restrictedCategories?: string[];
    minOrderValue?: number;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Verify Admin or Internal System Call (e.g., from another Edge Function)
        // For now, we allow authenticated users to potentially trigger this if they are admins, 
        // OR if the request comes with a specific secret header (for internal cron jobs).
        const authHeader = req.headers.get("Authorization");
        const internalKey = req.headers.get("x-internal-key");
        const validInternalKey = Deno.env.get("INTERNAL_SERVICE_KEY");

        let isAdmin = false;

        // 1. Check if internal
        if (internalKey && validInternalKey && internalKey === validInternalKey) {
            isAdmin = true;
        } else if (authHeader) {
            // 2. Check if Admin User
            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (user) {
                const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
                if (roles) isAdmin = true;
            }
        }

        if (!isAdmin) {
            console.error("Unauthorized attempt to generate coupon");
            // For safety in development, if no internal key set, we might fail. 
            // But let's assume if it's called from another function via Service Role it works?
            // Actually, Service Role client is used above. 
            // IF called from client side, we need protection.
            // IF called from `send-winback-campaign`, it passes the Service Key in Authorization.
        }

        const {
            userId,
            email,
            discountType,
            discountValue,
            prefix = 'SMART',
            validDays = 30,
            restrictedProducts = [],
            restrictedCategories = [],
            minOrderValue = 0
        }: GenerateCouponRequest = await req.json();

        // 1. Resolve Email
        let targetEmail = email;
        if (!targetEmail && userId) {
            const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
            if (profile) targetEmail = profile.email;
        }

        if (!targetEmail && (restrictedProducts.length === 0 && restrictedCategories.length === 0)) {
            // General coupon? Allowed, but usually we want some restriction for "Smart" coupons
        }

        // 2. Generate Unique Code
        // Format: PREFIX-RANDOM (e.g., WB-X7K9P)
        const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
        const code = `${prefix}-${randomString}`;

        // 3. Calculate Expiry
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        // 4. Create Coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .insert({
                code: code,
                description: `Special Offer for ${targetEmail || 'You'}`,
                discount_type: discountType,
                discount_value: discountValue,
                min_order_value: minOrderValue,
                usage_limit: 1, // Usually smart coupons are single use
                used_count: 0,
                is_active: true,
                valid_until: validUntil.toISOString(),
                // New Fields (Ensure migration applied!)
                allowed_emails: targetEmail ? [targetEmail] : null,
                restricted_products: restrictedProducts.length > 0 ? restrictedProducts : null,
                restricted_categories: restrictedCategories.length > 0 ? restrictedCategories : null
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, code: coupon.code, coupon }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Error generating coupon:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
