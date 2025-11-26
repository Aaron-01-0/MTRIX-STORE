const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetup() {
    console.log('Checking Storage Buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError);
    } else {
        console.log('Buckets:', buckets.map(b => b.name));
        const heroBucket = buckets.find(b => b.name === 'hero-images');
        if (heroBucket) {
            console.log('✅ hero-images bucket exists');
            console.log('Public:', heroBucket.public);
        } else {
            console.error('❌ hero-images bucket MISSING');
        }
    }

    console.log('\nChecking hero_images table...');
    const { data: heroImages, error: tableError } = await supabase
        .from('hero_images')
        .select('*')
        .limit(1);

    if (tableError) {
        console.error('Error accessing hero_images table:', tableError);
    } else {
        console.log('✅ hero_images table accessible');
        console.log('Row count (sample):', heroImages.length);
    }
}

checkSetup();
