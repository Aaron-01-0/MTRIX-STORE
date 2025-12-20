import React from 'https://esm.sh/react@18.2.0';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7';
import { Heading } from 'https://esm.sh/@react-email/heading@0.0.11';
import { Link } from 'https://esm.sh/@react-email/link@0.0.7';
import { Layout } from './Layout.tsx';
import { styles, colors } from './theme.ts';

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

    const getHeading = () => {
        switch (type) {
            case 'confirmed': return 'Payment Received';
            case 'processing': return 'Order Processing';
            case 'shipped': return 'Order Shipped';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Order Delivered';
            default: return 'Order Update';
        }
    };

    return (
        <Layout preview={`${getHeading()} - Order #${orderNumber}`}>
            <Heading style={styles.heading}>{getHeading()}</Heading>

            <Text style={styles.text}>
                Hi {customerName || 'Customer'},
            </Text>

            {type === 'placed' && (
                <>
                    <Text style={styles.text}>
                        We have received your order <span style={styles.goldText}>#{orderNumber}</span>.
                    </Text>
                    <div style={{ margin: '20px 0', padding: '15px', border: `1px solid ${colors.gray}`, borderRadius: '8px' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: '5px', color: colors.white }}>• Order ID: <span style={styles.goldText}>{orderNumber}</span></li>
                            {items && items.length > 0 && (
                                <li style={{ marginBottom: '5px', color: colors.white }}>
                                    • Items: <br />
                                    {items.map((item, i) => (
                                        <span key={i} style={{ display: 'block', paddingLeft: '15px', color: '#ccc' }}>- {item}</span>
                                    ))}
                                </li>
                            )}
                            {amount && <li style={{ marginBottom: '5px', color: colors.white }}>• Total: <span style={styles.goldText}>₹{amount}</span></li>}
                        </ul>
                    </div>
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
                </>
            )}

            {type === 'shipped' && (
                <>
                    <Text style={styles.text}>
                        Your order <span style={styles.goldText}>{orderNumber}</span> has officially left our facility.
                    </Text>
                    {trackingUrl ? (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <Link href={trackingUrl} style={styles.button}>Track it here</Link>
                        </div>
                    ) : trackingNumber ? (
                        <Text style={styles.text}>Tracking Number: {trackingNumber}</Text>
                    ) : null}
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
                    <Text style={styles.text}>
                        Your order <span style={styles.goldText}>{orderNumber}</span> has been delivered.
                    </Text>
                    <Text style={styles.text}>
                        We hope it exceeds your expectations. Welcome to the new standard.
                    </Text>
                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <Link href="https://mtrix.store" style={styles.button}>Visit Store</Link>
                    </div>
                </>
            )}

            <div style={{ marginTop: '30px', borderTop: `1px solid ${colors.gray}`, paddingTop: '20px' }}>
                <Text style={styles.text}>If you spot anything off, reply to this email. We’ve got you.</Text>
                <Text style={styles.text}>Welcome to the MTRIX side.</Text>
            </div>

        </Layout>
    );
};
