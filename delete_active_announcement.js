import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function deleteActive() {
    console.log('Deleting remaining active announcement...');

    // Fetch it first to be sure
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    if (data) {
        console.log(`Deleting announcement: ${data.message} (${data.id})`);
        const { error: delError } = await supabase
            .from('announcements')
            .delete()
            .eq('id', data.id);

        if (delError) console.error('Delete error:', delError);
        else console.log('Deleted successfully.');
    } else {
        console.log('No active announcement found.');
    }
}

deleteActive();
