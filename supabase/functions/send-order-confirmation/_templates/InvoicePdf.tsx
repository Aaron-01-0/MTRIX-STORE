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

export const InvoicePdf = ({ order }: InvoiceProps) => (
    <Document>
        <Page size="A4" style={styles.page}>


            {/* Addresses */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ width: '45%' }}>
                    <Text style={styles.label}>Bill To:</Text>
                    <Text style={styles.value}>{order.shipping_address?.name || 'Customer'}</Text>
                    <Text style={styles.value}>{order.shipping_address?.address_line_1}</Text>
                    {order.shipping_address?.address_line_2 && <Text style={styles.value}>{order.shipping_address?.address_line_2}</Text>}
                    <Text style={styles.value}>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pincode}</Text>
                    <Text style={styles.value}>{order.shipping_address?.country || 'India'}</Text>
                </View>
                <View style={{ width: '45%' }}>
                    <Text style={styles.label}>Ship To:</Text>
                    <Text style={styles.value}>{order.shipping_address?.name || 'Customer'}</Text>
                    <Text style={styles.value}>{order.shipping_address?.address_line_1}</Text>
                    {order.shipping_address?.address_line_2 && <Text style={styles.value}>{order.shipping_address?.address_line_2}</Text>}
                    <Text style={styles.value}>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pincode}</Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDescription}>Description</Text>
                    <Text style={styles.colQty}>Qty</Text>
                    <Text style={styles.colPrice}>Price</Text>
                    <Text style={styles.colTotal}>Total</Text>
                </View>
                {order.order_items.map((item: any, index: number) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.colDescription}>{item.product?.name || 'Item'}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colPrice}>₹{item.price}</Text>
                        <Text style={styles.colTotal}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>₹{order.total_amount}</Text>
                </View>
                {/* Add Tax/Shipping if available in order object */}
                <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 5, marginTop: 5 }]}>
                    <Text style={[styles.totalLabel, { color: '#000', fontSize: 12 }]}>Total:</Text>
                    <Text style={[styles.totalValue, { fontSize: 12, color: '#D4AF37' }]}>₹{order.total_amount}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Thank you for your business!</Text>
                <Text>MTRIX Store - Premium Gaming Gear</Text>
                <Text>support@mtrix.store | www.mtrix.store</Text>
            </View>
        </Page>
    </Document>
);
