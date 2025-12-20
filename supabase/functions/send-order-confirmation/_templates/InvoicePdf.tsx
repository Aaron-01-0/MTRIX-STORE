import React from 'https://esm.sh/react@18.2.0';
import { Document, Page, Text, View, StyleSheet, Image, Font } from 'https://esm.sh/@react-pdf/renderer@3.1.12';

// Register fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' },
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    logo: {
        width: 100,
        height: 40,
        objectFit: 'contain',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#D4AF37', // Gold
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    value: {
        marginBottom: 5,
    },
    table: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 8,
    },
    colDescription: { width: '50%' },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },

    totalSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 5,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
        color: '#666',
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#999',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
});

interface InvoiceProps {
    order: any;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

export const InvoicePdf = ({ order }: InvoiceProps) => {
    const isPaid = ['paid', 'success'].includes(order.payment_status);
    const subtotal = order.order_items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
    const discount = Number(order.discount_amount) || 0;
    let shipping = Number(order.total_amount) + discount - subtotal;
    if (shipping < 0 || Math.abs(shipping) < 0.01) shipping = 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>MTRIX</Text>
                        <Text style={{ fontSize: 10, color: '#666', marginTop: 5 }}>Support: noa@mtrix.store</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.value}>Invoice No: {order.order_number}</Text>
                        <Text style={styles.value}>Date: {formatDate(order.created_at)}</Text>
                        <Text style={[styles.value, { color: isPaid ? 'green' : 'orange', fontWeight: 'bold' }]}>
                            {isPaid ? 'PAID' : 'PENDING'}
                        </Text>
                    </View>
                </View>

                {/* Addresses & Payment */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
                    <View style={{ width: '45%' }}>
                        <Text style={[styles.label, { fontSize: 11, marginBottom: 5 }]}>Billed To:</Text>
                        <Text style={styles.value}>{order.shipping_address?.full_name || order.shipping_address?.name || 'Valued Customer'}</Text>
                        <Text style={styles.value}>{order.shipping_address?.address_line_1}</Text>
                        {order.shipping_address?.address_line_2 && <Text style={styles.value}>{order.shipping_address?.address_line_2}</Text>}
                        <Text style={styles.value}>
                            {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                        </Text>
                        <Text style={styles.value}>Phone: {order.shipping_address?.phone || 'N/A'}</Text>
                    </View>

                    <View style={{ width: '45%' }}>
                        <Text style={[styles.label, { fontSize: 11, marginBottom: 5 }]}>Payment Details:</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Transaction ID:</Text>
                            <Text style={styles.value}>{order.razorpay_payment_id || order.payment_id || 'N/A'}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Gateway:</Text>
                            <Text style={styles.value}>Razorpay</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Paid On:</Text>
                            <Text style={styles.value}>{isPaid ? formatDate(order.created_at) : 'Pending'}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDescription}>Item</Text>
                        <Text style={styles.colQty}>Qty</Text>
                        <Text style={styles.colPrice}>Price</Text>
                        <Text style={styles.colTotal}>Total</Text>
                    </View>
                    {order.order_items.map((item: any, index: number) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colDescription}>{item.products?.name || 'Item'}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>Rs. {Number(item.price).toFixed(2)}</Text>
                            <Text style={styles.colTotal}>Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>Rs. {subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</Text>
                        <Text style={styles.totalValue}>-Rs. {discount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Shipping:</Text>
                        <Text style={styles.totalValue}>Rs. {shipping.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5, marginTop: 5 }]}>
                        <Text style={[styles.totalLabel, { color: '#000', fontSize: 12, fontWeight: 'bold' }]}>Total Amount:</Text>
                        <Text style={[styles.totalValue, { fontSize: 12, color: '#D4AF37' }]}>Rs. {Number(order.total_amount).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Thank you for shopping with MTRIX!</Text>
                    <Text>support@mtrix.store | www.mtrix.store</Text>
                    <Text style={{ marginTop: 5, fontSize: 8, color: '#ccc' }}>This is a system generated invoice.</Text>
                </View>
            </Page>
        </Document>
    );
};
