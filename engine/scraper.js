const google = require('google-it');
const { validateEmail } = require('./validator');
const { supabase } = require('./supabase');

async function runScraper(targetCount = 5, filters = {}) {
    const { country = 'USA', city = '', niche = '', role = 'Founder' } = filters;
    
    console.log(`🚀 [Scraping] ${niche} in ${city}, ${country}...`);

    let foundCount = 0;
    
    const queries = [
        `"${niche}" "${city}" "${country}" "email" "gmail.com"`,
        `"${niche}" "${city}" "${country}" "contact" "email"`,
        `site:facebook.com "${niche}" "${city}" "${country}" "email"`,
        `site:linkedin.com "${role}" "${niche}" "${city}" "email"`
    ];

    for (let i = 0; i < queries.length; i++) {
        if (foundCount >= targetCount) break;

        const query = queries[i];

        try {
            console.log(`Query: ${query}`);
            await new Promise(r => setTimeout(r, 2000));

            const results = await google({ query, limit: 10, disableConsole: true });

            for (const res of results) {
                if (foundCount >= targetCount) break;

                try {
                    const snippet = res.snippet || '';
                    const title = res.title || '';
                    const content = (title + ' ' + snippet).toLowerCase();
                    
                    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    
                    if (emailMatch) {
                        const email = emailMatch[0].toLowerCase();
                        
                        const { data: existing } = await supabase
                            .from('leads')
                            .select('email')
                            .eq('email', email)
                            .single();

                        if (existing) continue;

                        const validationStatus = await validateEmail(email);
                        
                        if (validationStatus === 'Invalid') continue;

                        const bizName = title.split('-')[0].split('|')[0].trim() || 'Unknown Company';
                        
                        const lead = {
                            name: role,
                            company: bizName,
                            email: email,
                            city: city || 'N/A',
                            country: country || 'USA',
                            niche: niche,
                            status: 'Not Sent',
                            validation_status: validationStatus
                        };

                        const { error } = await supabase.from('leads').insert([lead]);
                            if (error) continue;

                            foundCount++;
                            console.log(`Found: ${email}`);
                        }
                    }
                } catch (e) {}
            }
        } catch (err) {
            console.error('Search error:', err.message);
        }
    }

    return { count: foundCount };
}

module.exports = { runScraper };

