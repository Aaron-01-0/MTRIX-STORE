import * as React from 'npm:react@18.3.1';
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
    Tailwind,
} from 'npm:@react-email/components@0.0.12';

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
            <Preview>Access Granted: Welcome to MTRIX</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>MTRIX</Text>
                        <Text style={subtitle}>OFFICIAL LAUNCH</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <div style={glowBar} />

                        <Heading style={h1}>ACCESS GRANTED</Heading>

                        <Text style={greeting}>
                            Welcome to the inner circle,
                        </Text>
                        <Text style={emailText}>
                            {email}
                        </Text>

                        <Text style={text}>
                            Your signal has been received and processed. You have secured your position on the waitlist for our exclusive holiday drop.
                        </Text>

                        <Section style={statsContainer}>
                            <Row>
                                <Column style={statCol}>
                                    <Text style={statLabel}>STATUS</Text>
                                    <Text style={statValue}>CONFIRMED</Text>
                                </Column>
                                <Column style={statCol}>
                                    <Text style={statLabel}>ACCESS LEVEL</Text>
                                    <Text style={statValue}>MEMBER</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={text}>
                            The portal opens on <strong>December 25, 2025</strong>. Prepare yourself.
                        </Text>

                        <Section style={btnContainer}>
                            <Button
                                style={button}
                                href={baseUrl}
                            >
                                VIEW STATUS
                            </Button>
                        </Section>

                        <Hr style={hr} />

                        {/* Footer */}
                        <Section style={footer}>
                            <Text style={footerQuote}>
                                "There is no spoon."
                            </Text>

                            <Row style={socialContainer}>
                                <Column>
                                    <Link href="https://instagram.com/mtrixstore" style={socialLink}>INSTAGRAM</Link>
                                </Column>

                            </Row>

                            <Text style={footerText}>
                                © 2024 MTRIX. All rights reserved.<br />
                                You are receiving this because you joined the Collective.
                            </Text>
                        </Section>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#000000',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
    color: '#ffffff',
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '30px',
};

const logo = {
    fontSize: '42px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '8px',
    margin: '0',
    fontFamily: 'Arial Black, sans-serif',
    textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
};

const subtitle = {
    fontSize: '10px',
    color: '#D4AF37',
    letterSpacing: '4px',
    marginTop: '8px',
    fontWeight: 'bold',
};

const content = {
    backgroundColor: '#0a0a0a',
    padding: '40px',
    borderRadius: '2px',
    border: '1px solid #222',
    position: 'relative' as const,
    overflow: 'hidden',
};

const glowBar = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
    boxShadow: '0 0 15px #D4AF37',
};

const h1 = {
    color: '#D4AF37',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '2px',
    textAlign: 'center' as const,
    margin: '0 0 30px',
    textTransform: 'uppercase' as const,
};

const greeting = {
    color: '#666',
    fontSize: '14px',
    textAlign: 'center' as const,
    margin: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
};

const emailText = {
    color: '#fff',
    fontSize: '18px',
    textAlign: 'center' as const,
    margin: '5px 0 30px',
    fontWeight: '500',
};

const text = {
    color: '#cccccc',
    fontSize: '15px',
    lineHeight: '26px',
    textAlign: 'center' as const,
    margin: '0 0 20px',
};

const statsContainer = {
    margin: '30px 0',
    padding: '20px 0',
    borderTop: '1px solid #222',
    borderBottom: '1px solid #222',
};

const statCol = {
    textAlign: 'center' as const,
    width: '50%',
};

const statLabel = {
    color: '#666',
    fontSize: '10px',
    letterSpacing: '2px',
    marginBottom: '5px',
};

const statValue = {
    color: '#D4AF37',
    fontSize: '16px',
    fontWeight: 'bold',
    letterSpacing: '1px',
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '40px',
    marginBottom: '20px',
};

const button = {
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 40px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    transition: 'all 0.3s ease',
};

const hr = {
    borderColor: '#222',
    margin: '40px 0',
};

const footer = {
    textAlign: 'center' as const,
};

const footerQuote = {
    color: '#444',
    fontStyle: 'italic',
    fontSize: '12px',
    marginBottom: '20px',
};

const socialContainer = {
    marginBottom: '20px',
    width: '200px',
    margin: '0 auto 20px',
};

const socialLink = {
    color: '#666',
    fontSize: '10px',
    textDecoration: 'none',
    letterSpacing: '2px',
    fontWeight: 'bold',
};

const footerText = {
    color: '#333',
    fontSize: '10px',
    lineHeight: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
};
