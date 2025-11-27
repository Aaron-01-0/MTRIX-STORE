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

interface WelcomeEmailProps {
    email: string;
}

export const WelcomeEmail = ({
    email,
}: WelcomeEmailProps) => {
    const baseUrl = 'https://mtrix.store';

    return (
        <Html>
            <Head />
            <Preview>Welcome to the Resistance - MTRIX</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>MTRIX</Text>
                    </Section>

                    <Section style={content}>
                        <Heading style={h1}>Signal Accepted</Heading>
                        <Text style={text}>
                            Welcome, {email}.
                        </Text>
                        <Text style={text}>
                            The system has processed your entry. You are now part of the inner circle.
                        </Text>
                        <Text style={text}>
                            We are currently loading the simulation. The breach is scheduled for <strong>December 25, 2024</strong>.
                        </Text>
                        <Text style={text}>
                            You will be the first to know when the portal opens.
                        </Text>

                        <Section style={btnContainer}>
                            <Button
                                style={button}
                                href={baseUrl}
                            >
                                Visit Mainframe
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        <Section style={{ textAlign: 'center' as const }}>
                            <Text style={footerText}>
                                Follow the white rabbit
                            </Text>
                            <Row style={{ width: 'auto', display: 'inline-block' }}>
                                <Column style={{ padding: '0 8px' }}>
                                    <Link href="https://instagram.com/mtrixstore" style={socialLink}>Instagram</Link>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={footerText}>
                            Stay vigilant.
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
