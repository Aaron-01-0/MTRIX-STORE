import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function listAll() {
    console.log('Listing ALL announcements:');
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No announcements found in table.');
    } else {
        data.forEach(a => {
            console.log(`[${a.is_active ? 'ACTIVE' : 'INACTIVE'}] ${a.message} (ID: ${a.id})`);
        });
    }
}

listAll();
