const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabase } = require('../engine/supabase');
const { runScraper } = require('../engine/scraper');
const { runMailer } = require('../engine/mailer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// API Endpoints
app.get('/api/leads', async (req, res) => {
    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(leads);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/scrape', async (req, res) => {
    const { country, city, niche, role, targetCount } = req.body;
    try {
        const results = await runScraper(targetCount || 5, { country, city, niche, role });
        res.json({ message: 'Scraping finished', count: results.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/send-email', async (req, res) => {
    const { smtpConfig, template, leadId } = req.body;
    try {
        await runMailer(smtpConfig, template, leadId);
        res.json({ message: 'Outreach successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logs', (req, res) => {
    // Note: Logs are still handled via console in serverless
    // In a real production app, we would save logs to Supabase as well
    res.json(["System connected to Supabase", "Database ready"]);
});

module.exports = app;
