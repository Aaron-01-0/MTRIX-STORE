import React from 'https://esm.sh/react@18.2.0';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7';
import { Heading } from 'https://esm.sh/@react-email/heading@0.0.11';
import { Link } from 'https://esm.sh/@react-email/link@0.0.7';
import { Layout } from './Layout.tsx';
import { styles } from './theme.ts';

interface OrderEmailProps {
    type: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';
    orderNumber: string;
    customerName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    items?: string[];
    amount?: string;
}

export const OrderEmail = ({ type, orderNumber, customerName, trackingNumber, trackingUrl, items, amount }: OrderEmailProps) => {
    const name = customerName || 'there';

    let title = '';
    let message = '';
    let preview = '';

    switch (type) {
        case 'placed': // 1. Order Confirmation
            title = 'Your MTRIX Order is Confirmed 🔥';
            preview = `Order ${orderNumber} confirmed.`;
            break;
        case 'confirmed': // 2. Payment Confirmation
            title = 'Payment Received — You’re All Set ✔️';
            preview = `Payment for Order ${orderNumber} received.`;
            break;
        case 'processing': // 3. Order Processing
            title = 'Your order is being prepared 🛠️';
            preview = `Order ${orderNumber} is in production.`;
            break;
        case 'shipped': // 4. Order Shipped
            title = 'Your MTRIX Order is on the Way 🚚💨';
            preview = `Order ${orderNumber} has shipped.`;
            break;
        case 'out_for_delivery': // 5. Out for Delivery
            title = 'Out for Delivery — It’s Almost There ⚡';
            preview = `Order ${orderNumber} is out for delivery.`;
            break;
        case 'delivered': // 6. Order Delivered
            title = 'Delivered ✔️ Tell us what you think';
            preview = `Order ${orderNumber} delivered.`;
            break;
    }

    return (
        <Layout preview={preview}>
            <Heading style={styles.heading}>{title}</Heading>
            <Text style={styles.text}>Hey {name},</Text>

            {type === 'placed' && (
                <>
                    <Text style={styles.text}>
                        Your order is locked in. Our team just got the signal and we're already gearing up to craft your package.
                    </Text>
                    <Text style={styles.text}>Here are your order details:</Text>
                    <div style={styles.box}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                            <li style={{ marginBottom: '5px', color: styles.white }}>• Order ID: <span style={styles.goldText}>{orderNumber}</span></li>
                            {items && items.length > 0 && (
                                <li style={{ marginBottom: '5px', color: styles.white }}>
                                    • Items: <br />
                                    {items.map((item, i) => (
                                        <span key={i} style={{ display: 'block', paddingLeft: '15px', color: '#ccc' }}>- {item}</span>
                                    ))}
                                </li>
                            )}
                            {amount && <li style={{ marginBottom: '5px', color: styles.white }}>• Total: <span style={styles.goldText}>₹{amount}</span></li>}
                        </ul>
                    </div>
                    <Text style={styles.text}>If you spot anything off, reply to this email. We’ve got you.</Text>
                    <Text style={styles.text}>Welcome to the MTRIX side.</Text>
                </>
            )}

            {type === 'confirmed' && (
                <>
                    <Text style={styles.text}>
                        Your payment for Order <span style={styles.goldText}>{orderNumber}</span> has been successfully received.
                    </Text>
                    <Text style={styles.text}>Invoice is attached below.</Text>
                    <Text style={styles.text}>Thanks for trusting MTRIX — premium begins here.</Text>
                </>
            )}

            {type === 'processing' && (
                <>
                    <Text style={styles.text}>
                        Your order is now in process. Our workspace is buzzing — fabric, prints, checks, everything moving.
                    </Text>
                    <Text style={styles.text}>We’ll update you as soon as it's shipped.</Text>
                    <Text style={styles.text}>Good things are worth the wait.</Text>
                </>
            )}

            {type === 'shipped' && (
                <>
                    <Text style={styles.text}>
                        Your order <span style={styles.goldText}>{orderNumber}</span> has officially left our facility.
                    </Text>
                    {trackingUrl && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <Link href={trackingUrl} style={styles.button}>Track it here</Link>
                        </div>
                    )}
                    {!trackingUrl && trackingNumber && (
                        <Text style={styles.text}>Tracking Number: {trackingNumber}</Text>
                    )}
                    <Text style={styles.text}>Next stop: your doorstep.</Text>
                </>
            )}

            {type === 'out_for_delivery' && (
                <>
                    <Text style={styles.text}>Heads up! Your order will be delivered today.</Text>
                    <Text style={styles.text}>Keep your phone close — delivery partner might call.</Text>
                </>
            )}

            {type === 'delivered' && (
                <>
                    <Text style={styles.text}>Your MTRIX order has been delivered.</Text>
                    <Text style={styles.text}>Hope it made your day a little more premium ✨</Text>
                    <Text style={styles.text}>If you liked it (or even loved it 😉), reply back or drop a review.</Text>
                </>
            )}
        </Layout>
    );
};
