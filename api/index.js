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
        
        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('relation "leads" does not exist')) {
                return res.json([]); // Return empty if table doesn't exist yet
            }
            throw error;
        }
        res.json(leads || []);
    } catch (e) {
        console.error('API Error:', e.message);
        res.status(500).json({ error: 'Database connection issue. Ensure you created the "leads" table in Supabase.', detail: e.message });
    }
});

app.post('/api/scrape', async (req, res) => {
    const { country, city, niche, role, targetCount } = req.body;
    try {
        const results = await runScraper(targetCount || 5, { country, city, niche, role });
        res.json({ message: 'Scraping finished', count: results.count });
    } catch (err) {
        console.error('Scrape Endpoint Error:', err);
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

app.get('/api/leads/export', async (req, res) => {
    try {
        const { data: leads, error } = await supabase.from('leads').select('*');
        if (error) throw error;
        
        const header = 'Name,Company,Email,Status,Validation\n';
        const rows = leads.map(l => `"${l.name}","${l.company}","${l.email}","${l.status}","${l.validation_status}"`).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.status(200).send(header + rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/logs', (req, res) => {
    res.json(["System connected to Supabase", "Check dashboard for results"]);
});

module.exports = app;
