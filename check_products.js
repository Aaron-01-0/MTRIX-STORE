
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);


async function checkProducts() {
    console.log('Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin.alpha@mtrix.store',
        password: 'MtrixAdmin2025!'
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }
    console.log('Auth success:', authData.user?.email);

    console.log('Fetching products...');
    const { data, error } = await supabase
        .from('products')
        .select('name, status, is_active, stock_status')
        .limit(10);

    if (error) {
        console.error('Error fetching products:', error.message);
    } else {
        console.log('Products:', JSON.stringify(data, null, 2));
    }
}

checkProducts();
