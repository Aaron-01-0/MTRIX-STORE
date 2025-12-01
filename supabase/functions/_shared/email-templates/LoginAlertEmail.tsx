import React from 'https://esm.sh/react@18.2.0';
import { Text } from 'https://esm.sh/@react-email/text@0.0.7';
import { Heading } from 'https://esm.sh/@react-email/heading@0.0.11';
import { Layout } from './Layout.tsx';
import { styles } from './theme.ts';

interface LoginAlertEmailProps {
    email: string;
    time: string;
    ip?: string;
    userAgent?: string;
}

export const LoginAlertEmail = ({ email, time, ip, userAgent }: LoginAlertEmailProps) => {
    return (
        <Layout preview="New Admin Login Detected">
            <Heading style={{ ...styles.heading, color: '#ff4444' }}>Security Alert: New Login</Heading>
            <Text style={styles.text}>
                A new login was detected for the admin account: <span style={styles.goldText}>{email}</span>
            </Text>

            <div style={styles.box}>
                <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: '80%' }}>
                    <Text style={{ ...styles.text, marginBottom: '5px' }}><strong>Time:</strong> {time}</Text>
                    <Text style={{ ...styles.text, marginBottom: '5px' }}><strong>IP Address:</strong> {ip || 'Unknown'}</Text>
                    <Text style={{ ...styles.text, marginBottom: '0' }}><strong>Device:</strong> {userAgent || 'Unknown'}</Text>
                </div>
            </div>

            <Text style={styles.text}>
                If this was you, you can ignore this email.
            </Text>
            <Text style={{ ...styles.text, color: '#ff4444', fontWeight: 'bold' }}>
                If this wasn't you, please change your password immediately and contact support.
            </Text>
        </Layout>
    );
};
