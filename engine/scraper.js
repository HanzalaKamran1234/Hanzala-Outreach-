const google = require('google-it');
const { supabase } = require('./supabase');

async function runScraper(targetCount = 2, filters = {}) {
    const { country = 'USA', city = '', niche = '', role = 'Founder' } = filters;
    
    console.log(`🚀 [Scraping] ${niche}...`);

    let foundCount = 0;
    const query = `"${niche}" "${city}" "${country}" "email" "gmail.com"`;

    try {
        const results = await google({ query, limit: 10, disableConsole: true });

        for (const res of results) {
            if (foundCount >= targetCount) break;

            const content = ((res.title || '') + ' ' + (res.snippet || '')).toLowerCase();
            const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            
            if (emailMatch) {
                const email = emailMatch[0].toLowerCase();
                
                const { data: existing } = await supabase.from('leads').select('email').eq('email', email).single();
                if (existing) continue;

                const bizName = (res.title || 'Unknown').split('-')[0].split('|')[0].trim();
                
                const lead = {
                    name: role,
                    company: bizName,
                    email: email,
                    city: city || 'N/A',
                    country: country || 'USA',
                    niche: niche,
                    status: 'Not Sent',
                    validation_status: 'Valid'
                };

                await supabase.from('leads').insert([lead]);
                foundCount++;
            }
        }
    } catch (err) {
        console.error('Scrape error:', err.message);
    }

    return { count: foundCount };
}

module.exports = { runScraper };
