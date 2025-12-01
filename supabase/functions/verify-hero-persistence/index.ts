import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    try {
        const testId = crypto.randomUUID();
        const testConfig = {
            headline_size: 10,
            headline_weight: '900',
            overlay_opacity: 75,
            animation_style: 'ken-burns',
            custom_setting: 'test_persistence'
        };

        // Debug: Check Auth
        console.log("Service Key Length:", supabaseServiceKey?.length);

        // 1. Insert
        console.log("Step 1: Inserting test record...");
        const { data: insertData, error: insertError } = await supabase
            .from('hero_images')
            .insert({
                id: testId,
                image_url: 'https://example.com/test.jpg',
                title: 'Test Hero',
                subtitle: 'Testing Persistence',
                config: testConfig,
                display_order: 999,
                is_active: false
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert Error Details:", JSON.stringify(insertError));
            throw new Error(`Insert failed: ${insertError.message} - ${insertError.details || ''}`);
        }

        // 2. Verify Insert
        console.log("Step 2: Verifying insert...");
        if (JSON.stringify(insertData.config) !== JSON.stringify(testConfig)) {
            throw new Error(`Config mismatch on insert. Expected ${JSON.stringify(testConfig)}, got ${JSON.stringify(insertData.config)}`);
        }

        // 3. Update
        console.log("Step 3: Updating record...");
        const newConfig = { ...testConfig, headline_size: 5, updated: true };
        const { data: updateData, error: updateError } = await supabase
            .from('hero_images')
            .update({
                title: 'Updated Test Hero',
                config: newConfig
            })
            .eq('id', testId)
            .select()
            .single();

        if (updateError) throw new Error(`Update failed: ${updateError.message}`);

        // 4. Verify Update
        console.log("Step 4: Verifying update...");
        if (JSON.stringify(updateData.config) !== JSON.stringify(newConfig)) {
            throw new Error(`Config mismatch on update. Expected ${JSON.stringify(newConfig)}, got ${JSON.stringify(updateData.config)}`);
        }

        // 5. Cleanup
        console.log("Step 5: Cleaning up...");
        const { error: deleteError } = await supabase
            .from('hero_images')
            .delete()
            .eq('id', testId);

        if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);

        return new Response(JSON.stringify({ success: true, message: "All persistence tests passed!" }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
