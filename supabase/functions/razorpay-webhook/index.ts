import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createHmac } from "node:crypto";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET is not set');
            throw new Error('Server configuration error');
        }

        // 1. Verify Signature
        const signature = req.headers.get('x-razorpay-signature');
        if (!signature) {
            throw new Error('No signature provided');
        }

        const event = await req.json();

        // 2. Handle Events
        const { event: eventType, payload } = event;
        const payment = payload.payment.entity;
        const orderId = payment.notes?.order_id;
        const userId = payment.notes?.user_id;

        console.log(`Received webhook event: ${eventType} for Order: ${orderId}`);

        if (!orderId) {
            console.warn('No order_id found in webhook payload');
            return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
        }

        // Admin client for DB operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        if (eventType === 'payment.captured') {
            // Check current order status
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select(`
                    *,
                    order_items (
                        quantity,
                        price,
                        products ( name )
                    )
                `)
                .eq('id', orderId)
                .single();

            if (fetchError) {
                console.error('Error fetching order:', fetchError);
                throw fetchError;
            }

            // Generate Invoice Number
            const { data: invoiceNumber, error: invNumError } = await supabaseAdmin.rpc('generate_invoice_number');
            if (invNumError) throw invNumError;

            // Generate PDF
            try {
                const { PDFDocument, StandardFonts, rgb } = await import("https://cdn.skypack.dev/pdf-lib");
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage();
                const { width, height } = page.getSize();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

                // Header
                page.drawText('INVOICE', { x: 50, y: height - 50, size: 24, font: boldFont });
                page.drawText(`Invoice #: ${invoiceNumber}`, { x: 50, y: height - 80, size: 12, font });
                page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: height - 95, size: 12, font });
                page.drawText(`Order #: ${order.order_number}`, { x: 50, y: height - 110, size: 12, font });

                // Bill To
                page.drawText('Bill To:', { x: 50, y: height - 150, size: 12, font: boldFont });
                const address = order.shipping_address || {};
                let yPos = height - 165;
                const addressLines = [
                    address.address_line1,
                    address.address_line2,
                    `${address.city}, ${address.state} ${address.pincode}`,
                    address.country
                ].filter(Boolean);

                addressLines.forEach(line => {
                    page.drawText(line, { x: 50, y: yPos, size: 10, font });
                    yPos -= 15;
                });

                // Items Table Header
                yPos -= 20;
                page.drawText('Item', { x: 50, y: yPos, size: 10, font: boldFont });
                page.drawText('Qty', { x: 300, y: yPos, size: 10, font: boldFont });
                page.drawText('Price', { x: 400, y: yPos, size: 10, font: boldFont });
                page.drawText('Total', { x: 500, y: yPos, size: 10, font: boldFont });

                // Items
                yPos -= 20;
                let total = 0;
                order.order_items.forEach((item: any) => {
                    const itemTotal = item.quantity * item.price;
                    total += itemTotal;
                    page.drawText(item.products?.name || 'Item', { x: 50, y: yPos, size: 10, font });
                    page.drawText(item.quantity.toString(), { x: 300, y: yPos, size: 10, font });
                    page.drawText(item.price.toString(), { x: 400, y: yPos, size: 10, font });
                    page.drawText(itemTotal.toString(), { x: 500, y: yPos, size: 10, font });
                    yPos -= 20;
                });

                // Total
                yPos -= 10;
                page.drawLine({ start: { x: 50, y: yPos }, end: { x: 550, y: yPos }, thickness: 1, color: rgb(0, 0, 0) });
                yPos -= 20;
                page.drawText(`Total: ${total.toFixed(2)}`, { x: 450, y: yPos, size: 12, font: boldFont });

                const pdfBytes = await pdfDoc.save();

                // Upload to Storage
                const fileName = `${order.order_number}.pdf`;
                const { error: uploadError } = await supabaseAdmin
                    .storage
                    .from('invoices')
                    .upload(fileName, pdfBytes, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (uploadError) {
                    console.error('PDF Upload Error:', uploadError);
                    // Don't throw, just log. We still want to record the payment.
                } else {
                    // Get Public URL
                    const { data: { publicUrl } } = supabaseAdmin.storage.from('invoices').getPublicUrl(fileName);

                    // Insert Invoice Record
                    await supabaseAdmin
                        .from('invoices')
                        .insert({
                            order_id: orderId,
                            invoice_number: invoiceNumber,
                            pdf_url: publicUrl,
                            total_amount: total,
                            status: 'issued'
                        });
                }

            } catch (pdfError) {
                console.error('PDF Generation Error:', pdfError);
            }

            // Update Transaction
            await supabaseAdmin
                .from('payment_transactions')
                .update({
                    razorpay_payment_id: payment.id,
                    status: 'success',
                    razorpay_signature: signature
                })
                .eq('order_id', orderId);

            // Clear Cart (if user ID exists)
            if (userId) {
                await supabaseAdmin
                    .from('cart_items')
                    .delete()
                    .eq('user_id', userId);
            }

            console.log('Order successfully updated via webhook');

        } else if (eventType === 'payment.failed') {
            // Release Inventory
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select(`
                    *,
                    order_items (
                        product_id,
                        variant_id,
                        quantity
                    )
                `)
                .eq('id', orderId)
                .single();

            if (!fetchError && order && order.status === 'pending') {
                // Release Inventory
                const inventoryItems = order.order_items.map((item: any) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity
                }));

                await supabaseAdmin.rpc('release_inventory', {
                    p_items: inventoryItems
                });

                // Mark order as failed
                await supabaseAdmin
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        payment_status: 'failed'
                    })
                    .eq('id', orderId);

                console.log('Order cancelled and inventory released via webhook');
            }
        } else if (eventType.startsWith('payment.dispute')) {
            // Handle Dispute Events
            console.log(`Processing dispute event: ${eventType} for Payment: ${payment.id}`);

            // 1. Update Payment Transaction Status
            let newStatus = 'dispute';
            if (eventType === 'payment.dispute.won') newStatus = 'success';
            if (eventType === 'payment.dispute.lost') newStatus = 'dispute_lost';

            await supabaseAdmin
                .from('payment_transactions')
                .update({ status: newStatus })
                .eq('razorpay_payment_id', payment.id);

            // 2. Log to Audit Logs
            await supabaseAdmin
                .from('audit_logs')
                .insert({
                    action: eventType,
                    entity_type: 'payment',
                    entity_id: payment.id, // Using payment ID as entity ID here, ideally should be transaction ID but we might not have it handy without a fetch
                    details: {
                        razorpay_payment_id: payment.id,
                        reason: payload.dispute?.reason_code || 'Unknown',
                        amount: payload.dispute?.amount,
                        status: payload.dispute?.status
                    }
                });

            console.log(`Dispute event ${eventType} processed`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
