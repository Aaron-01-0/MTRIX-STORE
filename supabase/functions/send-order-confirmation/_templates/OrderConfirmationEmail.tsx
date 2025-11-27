import * as React from 'https://esm.sh/react@18.2.0';
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Column,
    Row,
    Link,
} from 'https://esm.sh/@react-email/components@0.0.7';

interface OrderConfirmationEmailProps {
    order: {
        id: string;
        order_number: string;
        created_at: string;
        total_amount: number;
        order_items: Array<{
            quantity: number;
            price: number;
            product: {
                name: string;
                product_images: Array<{ image_url: string }>;
            };
        }>;
        [key: string]: any;
    };
    customerName: string;
}

export const OrderConfirmationEmail = ({
    order,
    customerName,
}: OrderConfirmationEmailProps) => {
    const baseUrl = 'https://mtrix.store';

    return (
        <Html>
            <Head />
            <Preview>Your MTRIX Order #{order.order_number} has been confirmed!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>MTRIX</Text>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Order Confirmed</Heading>
                        <Text style={text}>
                            Hi {customerName},
                        </Text>
                        <Text style={text}>
                            Thank you for your order! We're getting it ready to be shipped. We will notify you when it has been sent.
                        </Text>

                        <Section style={orderInfo}>
                            <Text style={orderId}>Order #{order.order_number}</Text>
                            <Text style={orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                        </Section>

                        <Hr style={hr} />

                        <Section>
                            <Text style={sectionTitle}>Order Summary</Text>
                            {order.order_items?.map((item, index) => (
                                <Row key={index} style={{ marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
                                    <Column style={{ width: '64px' }}>
                                        <Img
                                            src={item.product?.product_images?.[0]?.image_url || 'https://via.placeholder.com/64'}
                                            width="64"
                                            height="64"
                                            alt={item.product?.name}
                                            style={{ borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    </Column>
                                    <Column style={{ paddingLeft: '16px' }}>
                                        <Text style={productName}>{item.product?.name || 'Product'}</Text>
                                        <Text style={productMeta}>Qty: {item.quantity}</Text>
                                    </Column>
                                    <Column style={{ textAlign: 'right' }}>
                                        <Text style={productPrice}>₹{item.price * item.quantity}</Text>
                                    </Column>
                                </Row>
                            ))}
                            <Row style={{ marginTop: '16px' }}>
                                <Column>
                                    <Text style={totalLabel}>Total</Text>
                                </Column>
                                <Column style={{ textAlign: 'right' }}>
                                    <Text style={totalValue}>₹{order.total_amount}</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Section style={btnContainer}>
                            <Button
                                style={button}
                                href={`${baseUrl}/order/${order.id}`}
                            >
                                View Order
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        <Section style={{ textAlign: 'center' as const }}>
                            <Text style={footerText}>
                                Follow us for updates
                            </Text>
                            <Row style={{ width: 'auto', display: 'inline-block' }}>
                                <Column style={{ padding: '0 8px' }}>
                                    <Link href="https://instagram.com/mtrixstore" style={socialLink}>Instagram</Link>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={footerText}>
                            If you have any questions, reply to this email or contact our support team.
                        </Text>
                        <Text style={footerText}>
                            © 2024 MTRIX. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '560px',
};

const header = {
    textAlign: 'center' as const,
    padding: '20px',
};

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: '4px',
    fontFamily: 'Orbitron, sans-serif',
    textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
};

const content = {
    backgroundColor: '#111111',
    padding: '40px',
    borderRadius: '12px',
    border: '1px solid #333',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
};

const h1 = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '0 0 20px',
    textAlign: 'center' as const,
};

const text = {
    color: '#cccccc',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 20px',
};

const orderInfo = {
    backgroundColor: '#222',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center' as const,
    border: '1px solid #333',
};

const orderId = {
    color: '#D4AF37',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0',
};

const orderDate = {
    color: '#888',
    fontSize: '14px',
    margin: '5px 0 0',
};

const sectionTitle = {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    borderBottom: '1px solid #333',
    paddingBottom: '8px',
};

const productName = {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
};

const productMeta = {
    color: '#888',
    fontSize: '12px',
    margin: '4px 0 0',
};

const productPrice = {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0',
};

const totalLabel = {
    color: '#888',
    fontSize: '16px',
    fontWeight: 'bold',
};

const totalValue = {
    color: '#D4AF37',
    fontSize: '20px',
    fontWeight: 'bold',
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#D4AF37',
    borderRadius: '6px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
};

const hr = {
    borderColor: '#333',
    margin: '24px 0',
};

const footerText = {
    color: '#666',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    margin: '0 0 10px',
};

const socialLink = {
    color: '#D4AF37',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: 'bold',
};
