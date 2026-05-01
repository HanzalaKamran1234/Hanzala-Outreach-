const { runScraper } = require('./engine/scraper');

async function test() {
    console.log('Starting test...');
    try {
        const results = await runScraper(2, { niche: 'SaaS', country: 'USA' });
        console.log('Results:', results);
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
