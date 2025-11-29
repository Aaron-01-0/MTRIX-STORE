
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Signing in...');
    await supabase.auth.signInWithPassword({
        email: 'admin.gamma@mtrix.store',
        password: 'MtrixAdmin2025!'
    });

    const tables = ['products', 'orders', 'order_items', 'invoices', 'payments', 'bundles', 'launch_subscribers'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) console.error(`Error checking ${table}:`, error.message);
        else console.log(`${table}: ${count}`);
    }
}

checkData();
