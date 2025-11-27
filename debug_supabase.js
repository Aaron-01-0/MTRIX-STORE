
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing public read...');
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Read failed:', error.message);
    } else {
        console.log('Read success. Count:', data);
    }

    console.log('Testing Auth...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin.alpha@mtrix.store',
        password: 'MtrixAdmin2025!'
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
    } else {
        console.log('Auth success:', authData.user?.email);
    }
}

testConnection();
