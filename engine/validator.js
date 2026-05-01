const dns = require('dns').promises;
const net = require('net');

/**
 * Validates an email address using MX records and deep domain heuristics.
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
async function validateEmail(email) {
    if (!email || !email.includes('@')) return false;

    // 1. Syntax Check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const [user, domain] = email.split('@');

    // 2. Role-Based Check (Balanced)
    // We allow info/contact for small businesses, but reject clearly non-human ones for outreach
    const nonOutreachRoles = ['noreply', 'no-reply', 'billing', 'accounting', 'support', 'help', 'hr', 'jobs', 'careers', 'newsletter', 'dev', 'test'];
    if (nonOutreachRoles.some(r => user.toLowerCase().startsWith(r))) {
        return false; 
    }

    // 3. Known Disposable Check
    const disposable = ['tempmail.com', 'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'maildrop.cc'];
    if (disposable.includes(domain.toLowerCase())) return false;

    // 4. MX Record Verification
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) return false;

        // Sort by priority (lowest first)
        const bestMx = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

        // 5. Deep Check (SMTP Handshake)
        const isValid = await verifySmtp(bestMx, email);
        return isValid;

    } catch (err) {
        // If DNS fails, we can't trust it
        return false;
    }
}

/**
 * Performs a lite SMTP handshake to verify the mailbox exists.
 */
function verifySmtp(mx, email) {
    return new Promise((resolve) => {
        const socket = net.createConnection(25, mx);
        let step = 0;

        socket.setTimeout(8000); // 8s timeout for stability

        socket.on('data', (data) => {
            const response = data.toString();

            if (step === 0 && response.startsWith('220')) {
                socket.write(`HELO google.com\r\n`); // Use a common domain to be less suspicious
                step++;
            } else if (step === 1 && response.startsWith('250')) {
                socket.write(`MAIL FROM:<verified-agent@gmail.com>\r\n`);
                step++;
            } else if (step === 2 && response.startsWith('250')) {
                socket.write(`RCPT TO:<${email}>\r\n`);
                step++;
            } else if (step === 3) {
                if (response.startsWith('250')) {
                    resolve(true); // Mailbox exists!
                } else if (response.startsWith('550')) {
                    resolve(false); // No such user
                } else {
                    // 4XX or 5XX that isn't 550 usually means greylisted or anti-spam
                    // We'll treat it as valid to be safe, but risky
                    resolve(true); 
                }
                socket.write('QUIT\r\n');
                socket.end();
            }
        });

        socket.on('error', () => resolve(true)); // Fallback to MX check if SMTP blocked
        socket.on('timeout', () => {
            socket.destroy();
            resolve(true); // Fallback to MX check
        });
    });
}

module.exports = { validateEmail };
