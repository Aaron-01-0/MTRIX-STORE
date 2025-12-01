export const colors = {
    black: '#000000',
    darkGray: '#111111',
    mediumGray: '#222222',
    lightGray: '#cccccc',
    white: '#ffffff',
    gold: '#D4AF37',
    border: '#333333',
};

export const fonts = {
    main: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif`,
};

export const styles = {
    main: {
        fontFamily: fonts.main,
        backgroundColor: colors.black,
        color: colors.lightGray,
        padding: '20px',
    },
    container: {
        backgroundColor: colors.darkGray,
        padding: '40px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        maxWidth: '600px',
        margin: '0 auto',
    },
    logo: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: colors.gold,
        letterSpacing: '2px',
        textAlign: 'center' as const,
        marginBottom: '30px',
    },
    heading: {
        color: colors.white,
        fontSize: '24px',
        fontWeight: '600',
        margin: '0 0 20px',
        textAlign: 'center' as const,
    },
    text: {
        margin: '0 0 10px',
        lineHeight: '1.5',
    },
    box: {
        margin: '30px 0',
        padding: '20px',
        backgroundColor: colors.mediumGray,
        borderRadius: '4px',
        textAlign: 'center' as const,
    },
    button: {
        backgroundColor: colors.gold,
        color: colors.black,
        padding: '12px 24px',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        display: 'inline-block',
        textAlign: 'center' as const,
    },
    footer: {
        fontSize: '12px',
        color: '#666666',
        textAlign: 'center' as const,
        marginTop: '40px',
    },
    goldText: {
        color: colors.gold,
        fontWeight: 'bold',
    },
};
