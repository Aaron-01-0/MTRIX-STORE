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
} from 'https://esm.sh/@react-email/components@0.0.7';

interface OrderConfirmationEmailProps {
    order: {
        id: string;
        order_number: string;
        created_at: string;
        [key: string]: any;
    };
    customerName: string;
}

export const OrderConfirmationEmail = ({
    order,
    customerName,
}: OrderConfirmationEmailProps) => {
    const baseUrl = 'https://mtrix.store'; // Replace with actual domain

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

                        <Section style={btnContainer}>
                            <Button
                                style={button}
                                href={`${baseUrl}/order/${order.id}`}
                            >
                                View Order
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        <Text style={footerText}>
                            If you have any questions, reply to this email or contact our support team.
                        </Text>
                        <Text style={footerText}>
                            © 2024 MTRIX. All rights reserved.
                        </Text>
                        <Section style={{ textAlign: 'center' as const, marginTop: '20px' }}>
                            <Img
                                src="https://tguflnxyewjuuzckcemo.supabase.co/storage/v1/object/public/assets/ezgif-7bee47465acb1993.gif"
                                alt="Matrix Rain"
                                width="100%"
                                height="50"
                                style={{ objectFit: 'cover', borderRadius: '4px', opacity: 0.5 }}
                            />
                        </Section>
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
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: '2px',
};

const content = {
    backgroundColor: '#111111',
    padding: '40px',
    borderRadius: '8px',
    border: '1px solid #333',
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
    borderRadius: '4px',
    marginBottom: '24px',
    textAlign: 'center' as const,
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

const btnContainer = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const button = {
    backgroundColor: '#D4AF37',
    borderRadius: '4px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 24px',
};

const hr = {
    borderColor: '#333',
    margin: '20px 0',
};

const footerText = {
    color: '#666',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    margin: '0 0 10px',
};
