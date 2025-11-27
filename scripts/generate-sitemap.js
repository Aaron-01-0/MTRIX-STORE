import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Load env vars manually since we might not have dotenv
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#')) return;

                const separatorIndex = trimmedLine.indexOf('=');
                if (separatorIndex === -1) return;

                const key = trimmedLine.substring(0, separatorIndex).trim();
                let value = trimmedLine.substring(separatorIndex + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                process.env[key] = value;
            });
        }
    } catch (e) {
        console.log('Could not load .env file, relying on process.env');
    }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Use publishable key for read-only access

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DOMAIN = 'https://mtrix.store'; // Replace with actual domain

async function generateSitemap() {
    console.log('Generating sitemap...');

    const pages = [
        '',
        '/catalog',
        '/about',
        '/contact',
        '/faq',
        '/auth',
        '/cart'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Pages
    pages.forEach(page => {
        xml += `
  <url>
    <loc>${DOMAIN}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Products
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')
        .eq('is_active', true);

    if (products) {
        products.forEach(product => {
            xml += `
  <url>
    <loc>${DOMAIN}/product/${product.id}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
        });
    }

    // Categories
    const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('is_active', true);

    if (categories) {
        categories.forEach(category => {
            xml += `
  <url>
    <loc>${DOMAIN}/catalog?category=${category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
        });
    }

    xml += `
</urlset>`;

    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log('Sitemap generated successfully at public/sitemap.xml');
}

generateSitemap().catch(console.error);
