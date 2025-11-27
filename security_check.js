
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSecurity() {
    console.log('--- Starting Security Check ---');

    // 1. Sign Up a test user
    const email = `audit.user.${Date.now()}.${Math.random().toString(36).substring(7)}@gmail.com`;
    const password = 'password123';

    console.log(`Creating test user: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const user = authData.user;

    if (!user) {
        console.error('Could not authenticate user');
        return;
    }

    console.log('User authenticated:', user.id);

    // 2. Try to READ user_roles (should be allowed for own role, maybe not others)
    console.log('\n[TEST 1] Reading own roles...');
    const { data: myRoles, error: readError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

    if (readError) {
        console.log('Read failed (Expected if no roles? Or RLS?):', readError.message);
    } else {
        console.log('Read success:', myRoles);
    }

    // 3. Try to WRITE to user_roles (Attempt Privilege Escalation)
    console.log('\n[TEST 2] Attempting to grant ADMIN role...');
    const { error: writeError } = await supabase
        .from('user_roles')
        .insert({
            user_id: user.id,
            role: 'admin'
        });

    if (writeError) {
        console.log('Write failed (GOOD - RLS likely working):', writeError.message);
    } else {
        console.error('CRITICAL: Write SUCCESS! Privilege Escalation possible!');
        console.error('VULNERABILITY FOUND: Regular users can make themselves admins.');
    }

    // 4. Try to READ OTHER USERS' ORDERS (Data Isolation)
    console.log('\n[TEST 3] Reading orders...');
    const { data: orders, error: orderError } = await supabase.from('orders').select('*').limit(5);

    if (orderError) console.log('Read orders failed:', orderError.message);
    else {
        const otherOrders = orders.filter(o => o.user_id !== user.id);
        console.log(`Orders found: ${orders.length}. Other users' orders: ${otherOrders.length}`);
        if (otherOrders.length > 0) console.error('VULNERABILITY: Can see other users orders!');
    }

    // 5. Try to MODIFY PRODUCT PRICE (Integrity Check)
    console.log('\n[TEST 4] Modifying product price...');
    const { data: products } = await supabase.from('products').select('id').limit(1);
    if (products && products.length > 0) {
        const { error: updateError } = await supabase.from('products').update({ base_price: 0 }).eq('id', products[0].id);
        if (updateError) console.log('Update failed (GOOD):', updateError.message);
        else console.error('VULNERABILITY: Can change product prices!');
    }

    // 6. Try to READ OTHER PROFILES (PII Leak)
    console.log('\n[TEST 5] Reading profiles...');
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').limit(5);
    if (profileError) console.log('Read profiles failed:', profileError.message);
    else {
        const otherProfiles = profiles.filter(p => p.id !== user.id);
        console.log(`Profiles found: ${profiles.length}. Other profiles: ${otherProfiles.length}`);
        if (otherProfiles.length > 0) console.warn('WARNING: Can see other profiles (Check if intended).');
    }
}

testSecurity();
