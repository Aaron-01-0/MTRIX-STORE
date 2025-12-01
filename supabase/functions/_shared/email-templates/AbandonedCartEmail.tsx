import React from 'https://esm.sh/react@18.2.0';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7';
import { Heading } from 'https://esm.sh/@react-email/heading@0.0.11';
import { Link } from 'https://esm.sh/@react-email/link@0.0.7';
import { Layout } from './Layout.tsx';
import { styles } from './theme.ts';

interface AbandonedCartEmailProps {
    customerName?: string;
    items: string[];
}

export const AbandonedCartEmail = ({ customerName, items }: AbandonedCartEmailProps) => {
    const name = customerName || 'there';

    return (
        <Layout preview="You left something behind! 👀">
            <Heading style={styles.heading}>Don't Forget Your Style!</Heading>
            <Text style={styles.text}>Hey {name},</Text>
            <Text style={styles.text}>We noticed you left some great items in your cart:</Text>

            <div style={{ ...styles.box, textAlign: 'left' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map((item, index) => (
                        <li key={index} style={{
                            marginBottom: '10px',
                            color: styles.white,
                            borderBottom: index < items.length - 1 ? `1px solid ${styles.border}` : 'none',
                            paddingBottom: index < items.length - 1 ? '10px' : '0'
                        }}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <Text style={styles.text}>They're selling out fast! Complete your order now to secure your look.</Text>

            <div style={{ textAlign: 'center', margin: '30px 0' }}>
                <Link href="https://mtrix.store/cart" style={styles.button}>
                    Return to Cart
                </Link>
            </div>
        </Layout>
    );
};
