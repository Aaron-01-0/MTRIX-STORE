
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_PATH = 'MTRIX_Master_List.csv';

// Helper to guess variant type
function guessVariantType(variant) {
    const v = variant.toLowerCase();
    if (['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '11 oz', '600 ml', '750 ml'].includes(v)) return 'Size';
    if (v.includes('frame')) return 'Frame';
    if (v.includes('zipper')) return 'Style';
    if (['regular', 'acrylic'].includes(v)) return 'Material';
    return 'Option';
}

async function importData() {
    console.log('Starting import...');

    // 1. Sign in as Admin
    console.log('Attempting to sign in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin.alpha@mtrix.store',
        password: 'MtrixAdmin2025!'
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }
    console.log('Authenticated as Admin:', authData.user.email);

    // 2. Read CSV
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = fileContent.split('\n').filter(l => l.trim());

    // Skip header
    const dataLines = lines.slice(1);

    const categoryCache = {}; // name -> id
    const productCache = {}; // name -> id

    for (const line of dataLines) {
        // Handle potential quotes or commas in CSV (basic split for now, assuming simple CSV)
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));

        if (parts.length < 3) continue;

        const [categoryName, productName, variantName] = parts;

        if (!categoryName || !productName || !variantName) continue;

        // --- CATEGORY ---
        let categoryId = categoryCache[categoryName];
        if (!categoryId) {
            // Check if exists
            const { data: existing } = await supabase
                .from('categories')
                .select('id')
                .eq('name', categoryName)
                .maybeSingle();

            if (existing) {
                categoryId = existing.id;
            } else {
                // Create
                const { data: newCat, error: catError } = await supabase
                    .from('categories')
                    .insert({ name: categoryName })
                    .select()
                    .single();

                if (catError) {
                    console.error(`Error creating category ${categoryName}:`, catError.message);
                    continue;
                }
                categoryId = newCat.id;
                console.log(`Created Category: ${categoryName}`);
            }
            categoryCache[categoryName] = categoryId;
        }

        // --- PRODUCT ---
        let productId = productCache[productName];
        if (!productId) {
            // Check if exists
            const { data: existingP } = await supabase
                .from('products')
                .select('id')
                .eq('name', productName)
                .eq('category_id', categoryId)
                .maybeSingle();

            if (existingP) {
                productId = existingP.id;
            } else {
                // Create
                // Generate a basic SKU
                const sku = `${categoryName.substring(0, 3).toUpperCase()}-${productName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

                const { data: newProd, error: prodError } = await supabase
                    .from('products')
                    .insert({
                        name: productName,
                        category_id: categoryId,
                        base_price: 999, // Default price, user can update later
                        sku: sku,
                        is_active: true
                    })
                    .select()
                    .single();

                if (prodError) {
                    console.error(`Error creating product ${productName}:`, prodError.message);
                    continue;
                }
                productId = newProd.id;
                console.log(`Created Product: ${productName}`);
            }
            productCache[productName] = productId;
        }

        // --- VARIANT ---
        const variantType = guessVariantType(variantName);

        // Check if variant exists
        const { data: existingV } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId)
            .eq('variant_name', variantName)
            .maybeSingle();

        if (!existingV) {
            const { error: varError } = await supabase
                .from('product_variants')
                .insert({
                    product_id: productId,
                    variant_type: variantType,
                    variant_name: variantName,
                    stock_quantity: 100, // Default stock
                    price_adjustment: 0
                });

            if (varError) {
                console.error(`Error creating variant ${variantName} for ${productName}:`, varError.message);
            } else {
                console.log(`  + Added Variant: ${variantName} (${variantType})`);
            }
        }
    }

    console.log('Import completed!');
}

importData().catch(console.error);
