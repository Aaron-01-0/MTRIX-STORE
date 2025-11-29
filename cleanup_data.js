
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupData() {
    console.log('Starting cleanup...');

    // 1. Sign in
    console.log('Signing in...');
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin.gamma@mtrix.store',
        password: 'MtrixAdmin2025!'
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    // 1.5 Delete Bundles and Coupons
    console.log('Deleting Bundle Items...');
    const { error: bundleItemsError } = await supabase.from('bundle_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (bundleItemsError) console.error('Error deleting bundle items:', bundleItemsError.message);
    else console.log('Bundle Items deleted.');

    console.log('Deleting Bundles...');
    const { error: bundlesError } = await supabase.from('bundles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (bundlesError) console.error('Error deleting bundles:', bundlesError.message);
    else console.log('Bundles deleted.');

    console.log('Deleting Coupons...');
    const { error: couponsError } = await supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (couponsError) console.error('Error deleting coupons:', couponsError.message);
    else console.log('Coupons deleted.');

    // 2. Delete Order Items (Foreign Key to Orders and Products)
    console.log('Deleting Order Items...');
    const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (orderItemsError) console.error('Error deleting order items:', orderItemsError.message);
    else console.log('Order Items deleted.');

    // 2.3 Delete Payments (Foreign Key to Orders)
    console.log('Deleting Payments...');
    const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

    if (paymentsError) console.error('Error deleting payments:', paymentsError.message);
    else console.log(`Payments deleted: ${paymentsData.length}`);

    // 2.5 Delete Invoices (Foreign Key to Orders)
    console.log('Deleting Invoices...');
    const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

    if (invoicesError) console.error('Error deleting invoices:', invoicesError.message);
    else console.log(`Invoices deleted: ${invoicesData.length}`);

    // 3. Delete Orders (Foreign Key to Users)
    console.log('Deleting Orders...');
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

    if (ordersError) console.error('Error deleting orders:', ordersError.message);
    else console.log(`Orders deleted: ${ordersData.length}`);

    // 4. Delete Products
    console.log('Deleting Products...');
    const { error: productsError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (productsError) console.error('Error deleting products:', productsError.message);
    else console.log('Products deleted.');

    console.log('Cleanup complete.');
}

cleanupData();
