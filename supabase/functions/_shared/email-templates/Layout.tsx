import React from 'https://esm.sh/react@18.2.0';
import { Html } from 'https://esm.sh/@react-email/html@0.0.7';
import { Head } from 'https://esm.sh/@react-email/head@0.0.5';
import { Body } from 'https://esm.sh/@react-email/body@0.0.4';
import { Container } from 'https://esm.sh/@react-email/container@0.0.10';
import { Img } from 'https://esm.sh/@react-email/img@0.0.7';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7';
import { styles } from './theme.ts';

interface LayoutProps {
    children: React.ReactNode;
    preview?: string;
}

export const Layout = ({ children, preview }: LayoutProps) => {
    return (
        <Html>
            <Head />
            <Body style={styles.main}>
                {preview && <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{preview}</div>}
                <Container style={styles.container}>
                    <div style={styles.logo}>MTRIX</div>
                    {children}
                    <Text style={styles.footer}>
                        © {new Date().getFullYear()} MTRIX. All rights reserved.
                    </Text>
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Img
                            src="https://tguflnxyewjuuzckcemo.supabase.co/storage/v1/object/public/assets/ezgif-7bee47465acb1993.gif"
                            alt="Matrix Rain"
                            width="100%"
                            height="50"
                            style={{ objectFit: 'cover', borderRadius: '4px', opacity: 0.5 }}
                        />
                    </div>
                </Container>
            </Body>
        </Html>
    );
};
