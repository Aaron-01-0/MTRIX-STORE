import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
    console.log('Checking hero_images schema...');
    // Try to select the new columns
    const { data, error } = await supabase
        .from('hero_images')
        .select('text_alignment, text_color, overlay_gradient, button_text, button_link')
        .limit(1);

    if (error) {
        console.error('Schema check failed (Columns likely missing):', error.message);
        console.error('Error details:', error);
    } else {
        console.log('Schema check passed. Columns exist.');
    }
}

checkSchema();
