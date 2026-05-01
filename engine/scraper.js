const google = require('google-it');
const fs = require('fs');
const path = require('path');
const { validateEmail } = require('./validator');

const DB_PATH = path.join(__dirname, '..', 'db');
const LEADS_FILE = path.join(DB_PATH, 'leads.json');

async function runScraper(targetCount = 10, filters = {}) {
    const { country = 'USA', city = '', niche = '', role = 'Owner' } = filters;
    
    console.log(`🚀 Starting scraper for ${targetCount} leads in ${city}, ${country} (${niche})...`);

    let currentLeads = [];
    if (fs.existsSync(LEADS_FILE)) {
        try {
            currentLeads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
        } catch (e) { currentLeads = []; }
    }

    let foundCount = 0;
    
    const queries = [
        `"${niche}" "${city}" "${country}" "email" "gmail.com"`,
        `"${niche}" "${city}" "${country}" "contact" "email"`,
        `site:facebook.com "${niche}" "${city}" "${country}" "email"`,
        `site:linkedin.com "${role}" "${niche}" "${city}" "email"`,
        `"${niche}" "${city}" "${country}" "no website" "email"`
    ];

    for (let i = 0; i < queries.length; i++) {
        if (foundCount >= targetCount) break;

        const query = queries[i];

        try {
            console.log(`[Query ${i+1}] ${query}`);
            
            // Random delay to avoid bot detection
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));

            const results = await google({ query, limit: 30, disableConsole: true });

            for (const res of results) {
                if (foundCount >= targetCount) break;

                try {
                    const snippet = res.snippet || '';
                    const title = res.title || '';
                    const content = (title + ' ' + snippet).toLowerCase();
                    
                    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    
                    if (emailMatch) {
                        const email = emailMatch[0].toLowerCase();
                        
                        if (currentLeads.some(l => l.email === email)) continue;

                        const domain = email.split('@')[1];
                        const isGeneric = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'aol.com', 'msn.com'].includes(domain);
                        
                        let website = 'None';
                        try {
                            const url = new URL(res.link);
                            if (!['google', 'yelp', 'facebook', 'instagram', 'linkedin', 'yellowpages'].some(b => url.hostname.includes(b))) {
                                website = `${url.protocol}//${url.hostname}`;
                            } else if (!isGeneric) {
                                website = `https://${domain}`;
                            }
                        } catch (e) {}

                        // Blacklist check for domain
                        const blacklist = ['yelp.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'yellowpages.com', 'google.com'];
                        if (blacklist.some(b => domain.includes(b))) continue;

                        if (await validateEmail(email)) {
                            const bizName = title.split('-')[0].split('|')[0].split('—')[0].trim() || 'Unknown Company';
                            
                            const lead = {
                                id: Date.now() + Math.random().toString(36).substr(2, 9),
                                name: role || 'Decision Maker',
                                company: bizName,
                                email: email,
                                website: website,
                                city: city || 'Unknown',
                                country: country || 'USA',
                                niche: niche || 'General',
                                status: 'Not Contacted',
                                foundAt: new Date().toISOString()
                            };

                            currentLeads.push(lead);
                            foundCount++;
                            fs.writeFileSync(LEADS_FILE, JSON.stringify(currentLeads, null, 2));
                            console.log(`   [+] Added: ${email} (${bizName})`);
                        }
                    }
                } catch (e) {}
            }
        } catch (err) {
            if (err.message.includes('429')) {
                console.warn(`   [!] Rate limit. Waiting 60s...`);
                await new Promise(r => setTimeout(r, 60000));
            }
        }
    }

    console.log(`\n✅ Scraper finished. New leads found: ${foundCount}`);
    return currentLeads;
}

module.exports = { runScraper };

