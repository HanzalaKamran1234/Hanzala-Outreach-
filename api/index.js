const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { runScraper } = require('../engine/scraper');
const { runMailer } = require('../engine/mailer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// For serverless, we use /tmp for writes if needed, but for now we'll try to read from local
const DB_PATH = path.join(__dirname, '..', 'db');
const LEADS_FILE = path.join(DB_PATH, 'leads.json');
const LOGS_FILE = path.join(DB_PATH, 'activity.log');

// API Endpoints
app.get('/api/leads', (req, res) => {
    try {
        if (!fs.existsSync(LEADS_FILE)) return res.json([]);
        const data = fs.readFileSync(LEADS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read leads' });
    }
});

app.post('/api/scrape', async (req, res) => {
    const { country, city, niche, role, targetCount } = req.body;
    
    // In serverless, we can't easily run long background tasks
    // But we'll try to trigger it
    try {
        const results = await runScraper(targetCount || 5, { country, city, niche, role });
        res.json({ message: 'Scraping finished', count: results.length });
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
    try {
        if (!fs.existsSync(LOGS_FILE)) return res.json([]);
        const logs = fs.readFileSync(LOGS_FILE, 'utf8').split('\n').filter(Boolean).slice(-20);
        res.json(logs);
    } catch (e) {
        res.json([]);
    }
});

module.exports = app;
