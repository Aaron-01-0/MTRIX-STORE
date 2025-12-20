import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 1. Verify User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) throw new Error('Unauthorized');

        const { order_id } = await req.json();
        if (!order_id) throw new Error('Missing order_id');

        // 2. Fetch Order Details
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items (
                    quantity,
                    price,
                    products ( name, sku )
                )
            `)
            .eq('id', order_id)
            .single();

        if (fetchError || !order) throw new Error('Order not found');

        // 3. Authorization Check (Admin OR Order Owner)
        const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        const isAdmin = roleData?.role === 'admin';
        const isOwner = order.user_id === user.id;

        if (!isAdmin && !isOwner) {
            throw new Error('Unauthorized: You can only generate invoices for your own orders.');
        }

        // 4. Generate Invoice Number (if not exists)
        let { data: existingInvoice } = await supabaseAdmin
            .from('invoices')
            .select('id, invoice_number')
            .eq('order_id', order_id)
            .maybeSingle();

        let invoiceNumber = existingInvoice?.invoice_number;

        if (!invoiceNumber) {
            const { data: newInvNum, error: invNumError } = await supabaseAdmin.rpc('generate_invoice_number');
            if (invNumError) throw invNumError;
            invoiceNumber = newInvNum;
        }

        // 5. Generate PDF
        const { PDFDocument, StandardFonts, rgb } = await import("https://esm.sh/pdf-lib@1.17.1");
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Colors
        const goldColor = rgb(0.84, 0.64, 0.33); // #D6A354
        const blackColor = rgb(0.07, 0.07, 0.07); // #111111
        const grayColor = rgb(0.5, 0.5, 0.5);
        const lightGrayColor = rgb(0.89, 0.89, 0.89); // #E2E2E2

        // Helper to draw text
        const drawText = (text: string, x: number, y: number, size: number = 10, fontToUse = font, color = blackColor) => {
            page.drawText(text, { x, y, size, font: fontToUse, color });
        };

        // --- HEADER ---
        const headerY = height - 50;

        // Brand Info (Left)
        drawText('MTRIX', 50, headerY, 24, boldFont, goldColor);
        drawText('Support: noa@mtrix.store', 50, headerY - 20, 10, font, grayColor);

        // Invoice Info (Right)
        const rightColX = 350;
        let infoY = headerY;
        const infoLineHeight = 15;

        // Format Date to IST
        const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const isPaid = ['paid', 'success'].includes(order.payment_status);

        const drawInfoRow = (label: string, value: string) => {
            drawText(`${label}:`, rightColX, infoY, 10, boldFont);
            drawText(value, rightColX + 100, infoY, 10, font);
            infoY -= infoLineHeight;
        };

        drawInfoRow('Invoice No', invoiceNumber);
        drawInfoRow('Invoice Date', orderDate);
        drawInfoRow('Order ID', order.order_number);
        drawInfoRow('Payment Mode', 'Online');
        drawInfoRow('Status', isPaid ? 'Paid' : 'Pending');
        drawInfoRow('Place of Supply', order.shipping_address?.state || 'N/A');
        drawInfoRow('Channel', 'Website');

        // --- CUSTOMER DETAILS ---
        let sectionY = infoY - 30;

        // Fetch Profile for Name/Email if missing in address
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', order.user_id)
            .single();

        const { data: userEmail } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        const email = userEmail?.user?.email;

        // Billed To (Left)
        drawText('Billed To:', 50, sectionY, 12, boldFont);
        const billingAddress = order.shipping_address || {};
        let billY = sectionY - 20;

        const billLines = [
            billingAddress.full_name || billingAddress.name || profile?.full_name || 'Valued Customer',
            billingAddress.phone || profile?.phone_number || 'N/A',
            billingAddress.email || email || 'N/A',
            `${billingAddress.address_line_1 || ''} ${billingAddress.address_line_2 || ''}`,
            `${billingAddress.city || ''}, ${billingAddress.state || ''} - ${billingAddress.pincode || ''}`
        ].filter(Boolean);

        billLines.forEach(line => {
            drawText(line, 50, billY, 10, font);
            billY -= 15;
        });

        // Shipped To (Right)
        drawText('Shipped To:', 300, sectionY, 12, boldFont);
        let shipY = sectionY - 20;
        drawText('Same as billing address', 300, shipY, 10, font);

        // --- PAYMENT DETAILS ---
        const payY = billY - 30;
        drawText('PAYMENT DETAILS', 50, payY, 12, boldFont, goldColor);

        const transactionId = order.razorpay_payment_id || order.payment_id || 'N/A';
        drawText('Transaction ID: ' + transactionId, 50, payY - 20, 10, font);
        drawText('Gateway: Razorpay', 50, payY - 35, 10, font);

        drawText('Status: ' + (isPaid ? 'Paid' : 'Pending'), 300, payY - 20, 10, font);
        drawText('Paid On: ' + (isPaid ? orderDate : 'Pending'), 300, payY - 35, 10, font);

        // --- PRODUCT TABLE ---
        sectionY = payY - 60;

        // Table Header
        const tableTop = sectionY;
        page.drawRectangle({ x: 40, y: tableTop - 5, width: 520, height: 25, color: lightGrayColor });

        // Removed Tax Column
        const colX = { item: 50, sku: 250, qty: 380, price: 430, total: 500 };
        const rowY = tableTop + 2;

        drawText('Item', colX.item, rowY, 10, boldFont);
        drawText('SKU', colX.sku, rowY, 10, boldFont);
        drawText('Qty', colX.qty, rowY, 10, boldFont);
        drawText('Price', colX.price, rowY, 10, boldFont);
        drawText('Total', colX.total, rowY, 10, boldFont);

        // Table Rows
        let currentTableY = tableTop - 25;
        let subtotal = 0;

        order.order_items.forEach((item: any) => {
            const itemPrice = Number(item.price);
            const itemQty = Number(item.quantity);
            const itemTotal = itemPrice * itemQty;

            // No Tax Calculation
            subtotal += itemTotal;

            drawText(item.products?.name || 'Item', colX.item, currentTableY, 9, font);
            drawText(item.products?.sku || 'N/A', colX.sku, currentTableY, 9, font);
            drawText(itemQty.toString(), colX.qty, currentTableY, 9, font);
            drawText(`Rs. ${itemPrice.toFixed(2)}`, colX.price, currentTableY, 9, font);
            drawText(`Rs. ${itemTotal.toFixed(2)}`, colX.total, currentTableY, 9, font);

            currentTableY -= 20;
        });

        // --- FOOTER ---
        let footerY = currentTableY - 20;
        const footerX = 350;
        const valX = 500;

        // Divider
        page.drawLine({ start: { x: 40, y: footerY + 10 }, end: { x: 560, y: footerY + 10 }, thickness: 1, color: lightGrayColor });

        const drawFooterRow = (label: string, value: string, isBold = false) => {
            drawText(label, footerX, footerY, 10, isBold ? boldFont : font);
            drawText(value, valX, footerY, 10, isBold ? boldFont : font);
            footerY -= 20;
        };

        const discount = Number(order.discount_amount) || 0;
        // Back-calculate shipping: Total + Discount - Subtotal
        let shippingCharges = order.total_amount + discount - subtotal;
        // Floating point safety check
        if (shippingCharges < 0 || Math.abs(shippingCharges) < 0.01) shippingCharges = 0;

        const grandTotal = order.total_amount;

        drawFooterRow('Subtotal:', `Rs. ${subtotal.toFixed(2)}`);

        if (order.coupon_code) {
            drawFooterRow(`Discount (${order.coupon_code}):`, `-Rs. ${discount.toFixed(2)}`);
        } else {
            drawFooterRow('Discounts:', `-Rs. ${discount.toFixed(2)}`);
        }

        drawFooterRow('Shipping:', `Rs. ${shippingCharges.toFixed(2)}`);
        // Removed Tax Row

        // Grand Total Background
        page.drawRectangle({ x: footerX - 10, y: footerY - 5, width: 220, height: 25, color: lightGrayColor });
        drawFooterRow('Total Amount:', `Rs. ${grandTotal.toFixed(2)}`, true);

        // --- LEGAL & COMPLIANCE ---
        const legalY = 100;
        drawText('Invoice Note:', 50, legalY, 10, boldFont);
        drawText('This is a system-generated invoice and does not require a physical signature.', 50, legalY - 15, 9, font, grayColor);

        // Removed Return Policy

        const pdfBytes = await pdfDoc.save();

        // 6. Upload to Storage
        const fileName = `${order.order_number}.pdf`;

        // Attempt to remove existing file to ensure clean write
        await supabaseAdmin.storage.from('invoices').remove([fileName]);

        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('invoices')
            .upload(fileName, pdfBytes, {
                contentType: 'application/pdf',
                upsert: true,
                cacheControl: '0'
            });

        if (uploadError) throw uploadError;

        // 7. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage.from('invoices').getPublicUrl(fileName);

        // 8. Insert or Update Invoice Record
        const invoiceData = {
            order_id: order_id,
            invoice_number: invoiceNumber,
            pdf_url: publicUrl,
            total_amount: grandTotal,
            tax_amount: 0, // No tax
            status: 'issued'
        };

        let dbError;
        if (existingInvoice?.id) {
            const { error } = await supabaseAdmin
                .from('invoices')
                .update(invoiceData)
                .eq('id', existingInvoice.id);
            dbError = error;
        } else {
            const { error } = await supabaseAdmin
                .from('invoices')
                .insert([invoiceData]);
            dbError = error;
        }

        if (dbError) throw dbError;

        return new Response(JSON.stringify({ success: true, url: publicUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Generate Invoice Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
