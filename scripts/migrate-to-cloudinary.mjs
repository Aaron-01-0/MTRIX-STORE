/**
 * Migrate Existing Images from Supabase to Cloudinary
 * 
 * This script:
 * 1. Fetches all image URLs from the database
 * 2. Downloads each image from Supabase Storage
 * 3. Uploads to Cloudinary
 * 4. Updates the database with new Cloudinary URLs
 * 
 * Usage:
 *   node scripts/migrate-to-cloudinary.mjs
 * 
 * Required Environment Variables:
 *   - VITE_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (for database updates)
 *   - CLOUDINARY_CLOUD_NAME
 *   - CLOUDINARY_API_KEY
 *   - CLOUDINARY_API_SECRET
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dptsqmgpi';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary credentials. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
    console.log('\nGet these from: https://cloudinary.com/console (Settings → Access Keys)');
    process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables and columns to migrate
const MIGRATION_CONFIG = [
    {
        table: 'product_images',
        columns: ['image_url', 'thumbnail_url'],
        folder: 'products',
        idColumn: 'id'
    },
    {
        table: 'hero_images',
        columns: ['image_url', 'mobile_image_url'],
        folder: 'hero',
        idColumn: 'id'
    },
    {
        table: 'categories',
        columns: ['image_url'],
        folder: 'categories',
        idColumn: 'id'
    },
    {
        table: 'product_variants',
        columns: ['image_url'],
        folder: 'variants',
        idColumn: 'id'
    },
    {
        table: 'bundles',
        columns: ['image_url'],
        folder: 'bundles',
        idColumn: 'id'
    },
    {
        table: 'social_content',
        columns: ['image_url'],
        folder: 'community',
        idColumn: 'id'
    },
    {
        table: 'arena_designs',
        columns: ['image_url'],
        folder: 'arena',
        idColumn: 'id'
    }
];

// Stats tracking
const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: []
};

/**
 * Check if URL is a Supabase storage URL
 */
function isSupabaseUrl(url) {
    return url && (
        url.includes('supabase.co/storage') ||
        url.includes('supabase.in/storage')
    );
}

/**
 * Check if URL is already a Cloudinary URL
 */
function isCloudinaryUrl(url) {
    return url && url.includes('cloudinary.com');
}

/**
 * Upload image to Cloudinary via URL
 */
async function uploadToCloudinary(imageUrl, folder) {
    const timestamp = Math.floor(Date.now() / 1000);

    // Create signature for authenticated upload
    const signatureString = `folder=mtrix/${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const crypto = await import('crypto');
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('folder', `mtrix/${folder}`);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error(`    ❌ Cloudinary upload failed: ${error.message}`);
        return null;
    }
}

/**
 * Migrate a single table
 */
async function migrateTable(config) {
    console.log(`\n📦 Migrating ${config.table}...`);

    // Fetch all rows
    const { data: rows, error } = await supabase
        .from(config.table)
        .select(`${config.idColumn}, ${config.columns.join(', ')}`);

    if (error) {
        console.error(`  ❌ Failed to fetch ${config.table}: ${error.message}`);
        stats.errors.push({ table: config.table, error: error.message });
        return;
    }

    if (!rows || rows.length === 0) {
        console.log(`  ⏭️  No rows found in ${config.table}`);
        return;
    }

    console.log(`  Found ${rows.length} rows`);

    for (const row of rows) {
        for (const column of config.columns) {
            const currentUrl = row[column];
            stats.total++;

            // Skip if no URL, already Cloudinary, or not Supabase
            if (!currentUrl) {
                stats.skipped++;
                continue;
            }

            if (isCloudinaryUrl(currentUrl)) {
                console.log(`  ⏭️  Already on Cloudinary: ${config.table}.${column} (${row[config.idColumn]})`);
                stats.skipped++;
                continue;
            }

            if (!isSupabaseUrl(currentUrl)) {
                console.log(`  ⏭️  Not a Supabase URL: ${config.table}.${column} (${row[config.idColumn]})`);
                stats.skipped++;
                continue;
            }

            // Migrate this image
            console.log(`  🔄 Migrating: ${config.table}.${column} (${row[config.idColumn]})`);

            const newUrl = await uploadToCloudinary(currentUrl, config.folder);

            if (newUrl) {
                // Update database with new URL
                const { error: updateError } = await supabase
                    .from(config.table)
                    .update({ [column]: newUrl })
                    .eq(config.idColumn, row[config.idColumn]);

                if (updateError) {
                    console.error(`    ❌ Failed to update DB: ${updateError.message}`);
                    stats.failed++;
                    stats.errors.push({
                        table: config.table,
                        id: row[config.idColumn],
                        error: updateError.message
                    });
                } else {
                    console.log(`    ✅ Migrated successfully`);
                    stats.migrated++;
                }
            } else {
                stats.failed++;
            }
        }
    }
}

/**
 * Main migration function
 */
async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   MTRIX: Supabase → Cloudinary Image Migration           ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\nCloudinary: ${CLOUDINARY_CLOUD_NAME}`);
    console.log(`Supabase: ${SUPABASE_URL}\n`);

    const startTime = Date.now();

    // Migrate each table
    for (const config of MIGRATION_CONFIG) {
        await migrateTable(config);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║   Migration Complete                                      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Summary:`);
    console.log(`   Total images processed: ${stats.total}`);
    console.log(`   ✅ Migrated: ${stats.migrated}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏱️  Duration: ${duration}s`);

    if (stats.errors.length > 0) {
        console.log(`\n⚠️  Errors:`);
        stats.errors.forEach(e => {
            console.log(`   - ${e.table}${e.id ? ` (${e.id})` : ''}: ${e.error}`);
        });
    }

    console.log('\n✨ Done! Your images are now served from Cloudinary.');
}

// Run migration
main().catch(console.error);
