const dns = require('dns').promises;

async function validateEmail(email) {
    if (!email) return 'Invalid';

    // 1. Format Check
    const formatRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formatRegex.test(email)) return 'Invalid';

    const domain = email.split('@')[1].toLowerCase();

    // 2. Disposable / Generic Check
    const genericDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];
    if (genericDomains.includes(domain)) return 'Valid';

    try {
        // 3. MX Record Check
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
            return 'Valid';
        }
        return 'Risky';
    } catch (err) {
        return 'Invalid';
    }
}

module.exports = { validateEmail };
