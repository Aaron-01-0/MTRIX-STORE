/**
 * Common disposable email domains to block
 */
const DISPOSABLE_DOMAINS = new Set([
    'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'guerrillamail.com',
    'sharklasers.com', 'yopmail.com', 'getnada.com', 'temp-mail.org',
    '10minutemail.com', '10minutemail.net', 'dispostable.com', 'yopmail.net',
    'cool.fr.nf', 'jetable.org', 'topmail.kz', 'meltmail.com', 'trashmail.com',
    'dropmail.me', 'moakt.com', 'inbox.testmail.app', 'tempmailo.com',
    'maildrop.cc', 'harakirimail.com', 'spam4.me', 'disbox.org', 'emailondeck.com',
    'mytemp.email', 'tempmail.net', 'tempm.com', 'temp-mail.io', 'emailfake.com',
    'fake-email.com', 'fakermail.com', 'generator.email', 'getairmail.com',
    'luxusmail.org', 'makemure.com', 'manchant.com', 'my10minutemail.com',
    'nervtemp.com', 'owlymail.com', 'pjjkp.com', 'qmail.com', 'temp.email',
    'tempail.com', 'tempmail.de', 'tempmail.ninja', 'tempmail.plus', 'tempmail.us',
    'tempr.email', 'thetempmail.com', 'tmail.com', 'trashmail.net', 'throwaway.com',
    'test.com', 'example.com', 'example.org'
]);

/**
 * Validates if an email address is likely real and not from a disposable provider.
 * Returns { valid: boolean, error?: string }
 */
export const validateEmailStrict = (email: string): { valid: boolean; error?: string } => {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Basic Format Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return { valid: false, error: 'Invalid email format' };
    }

    const [localPart, domain] = normalizedEmail.split('@');

    // 2. Disposable Domain Check
    if (DISPOSABLE_DOMAINS.has(domain)) {
        return { valid: false, error: 'Disposable email addresses are not allowed' };
    }

    // 3. Obvious Fake Patterns
    // "test@..." "admin@..." (too generic)
    if (['test', 'admin', 'user', 'example', 'fake', 'random'].includes(localPart)) {
        return { valid: false, error: 'This email address looks generic' };
    }

    // 4. Keyboard Smash Heuristic (Repeating chars)
    // e.g. "aaaaa@gmail.com" or "123456@gmail.com" - rough check
    if (/^([a-z0-9])\1{4,}/.test(localPart)) { // 5 or more same chars
        return { valid: false, error: 'This email address looks invalid' };
    }

    return { valid: true };
};
