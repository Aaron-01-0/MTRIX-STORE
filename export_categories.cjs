
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://tguflnxyewjuuzckcemo.supabase.co';
const supabaseKey = 'sb_publishable_LbK05koWQ4xGGcddQcriUg_9yEcQg8t';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportCategories() {
    console.log('Fetching categories...');
    const { data, error } = await supabase
        .from('categories')
        .select('*');

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No categories found.');
        return;
    }

    console.log(`Found ${data.length} categories.`);

    // Create CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
        Object.values(row).map(value => {
            if (value === null) return '';
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value;
        }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');

    fs.writeFileSync('categories.csv', csvContent);
    console.log('Successfully exported to categories.csv');
}

exportCategories();
