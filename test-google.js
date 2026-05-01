const google = require('google-it');

async function test() {
    try {
        const results = await google({ query: 'SaaS "gmail.com"', limit: 5 });
        console.log('Results:', results);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
