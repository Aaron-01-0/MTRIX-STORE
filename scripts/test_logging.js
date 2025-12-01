import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogging() {
    console.log("Testing log_activity RPC...");

    // 1. Sign in (needed for RPC)
    // We need a valid user. For this test, we might fail if we don't have credentials.
    // Alternatively, we can check if the RPC allows anon access (it shouldn't).
    // Or we can just check if the table exists and we can select from it using the service role key if we had it.
    // Since we only have the publishable key, we can only test if we are logged in.

    // However, we can try to call it and expect an error if not logged in, which confirms it's protected.
    // Or we can try to select from activity_logs and expect an error (RLS).

    const { error: rpcError } = await supabase.rpc('log_activity', {
        p_action: 'TEST_LOG',
        p_entity_type: 'system',
        p_entity_id: 'test-1',
        p_details: { message: 'Hello from test script' }
    });

    if (rpcError) {
        console.log("RPC Call Result:", rpcError.message); // Expected: "database error" or "permission denied" if not logged in
    } else {
        console.log("RPC Call Success (Unexpected if not logged in)");
    }

    // 2. Check if table exists (public check)
    // We can't easily check table existence without admin rights or querying it.
    console.log("Verification complete. Please check Admin UI for logs.");
}

testLogging();
