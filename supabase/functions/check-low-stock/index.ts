import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LowStockProduct {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
    reorder_quantity: number | null;
}

interface LowStockVariant {
    id: string;
    product_name: string;
    sku: string | null;
    stock_quantity: number;
    color: string | null;
    size: string | null;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

        // Admin client to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Low Stock Items
        const { data: products, error: productsError } = await supabaseAdmin.rpc('get_low_stock_products');
        if (productsError) throw productsError;

        const { data: variants, error: variantsError } = await supabaseAdmin.rpc('get_low_stock_variants');
        if (variantsError) throw variantsError;

        const lowStockProducts: LowStockProduct[] = products || [];
        const lowStockVariants: LowStockVariant[] = variants || [];

        const totalItems = lowStockProducts.length + lowStockVariants.length;

        if (totalItems === 0) {
            return new Response(
                JSON.stringify({ message: 'No low stock items found. No email sent.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // 2. Generate Email Content
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #d4af37; padding: 20px; text-align: center; }
          .alert { color: #e11d48; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background-color: #f8f9fa; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MTRIX Store Inventory Alert</h1>
          </div>
          <p>Hello Admin,</p>
          <p>The following <strong>${totalItems} items</strong> have fallen below their low stock threshold and require attention.</p>
          
          ${lowStockProducts.length > 0 ? `
            <h3>Products (${lowStockProducts.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockProducts.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>${p.sku}</td>
                    <td class="alert">${p.stock_quantity}</td>
                    <td>${p.reorder_quantity || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${lowStockVariants.length > 0 ? `
            <h3>Variants (${lowStockVariants.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockVariants.map(v => `
                  <tr>
                    <td>${v.product_name}</td>
                    <td>${[v.color, v.size].filter(Boolean).join(' / ')}</td>
                    <td>${v.sku || '-'}</td>
                    <td class="alert">${v.stock_quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p>This is an automated message from your MTRIX Store Inventory System.</p>
            <a href="https://mtrix.store/admin/inventory">Manage Inventory</a>
          </div>
        </div>
      </body>
      </html>
    `;

        // 3. Send Email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'MTRIX Inventory <inventory@mtrix.store>', // Ensure this domain is verified in Resend
                to: ['raj00.mkv@gmail.com'], // Hardcoded for now, or fetch from settings
                subject: `⚠️ Low Stock Alert: ${totalItems} Items Need Restocking`,
                html: emailHtml
            })
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API Error:', resendData);
            throw new Error('Failed to send email via Resend');
        }

        return new Response(
            JSON.stringify({ success: true, message: `Email sent to admin.`, data: resendData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        console.error('Error in check-low-stock:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
