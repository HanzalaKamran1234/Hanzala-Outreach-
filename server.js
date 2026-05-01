const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { runScraper } = require('./engine/scraper');
const { runMailer } = require('./engine/mailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, 'db');
const LEADS_FILE = path.join(DB_PATH, 'leads.json');
const LOGS_FILE = path.join(DB_PATH, 'activity.log');

// Ensure DB and Logs exist
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]');
if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, '');

function addLog(message) {
    const log = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(LOGS_FILE, log);
    console.log(message);
}

// API Endpoints
app.get('/api/leads', (req, res) => {
    try {
        const data = fs.readFileSync(LEADS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read leads' });
    }
});

app.post('/api/scrape', async (req, res) => {
    const { country, city, niche, role, targetCount } = req.body;
    addLog(`Starting scrape for ${niche} in ${city}, ${country} (Role: ${role})`);
    
    // Send immediate response that scraping started
    res.json({ message: 'Scraping started' });

    try {
        // Run scraper in background
        await runScraper(targetCount || 10, { country, city, niche, role });
        addLog(`Scraping completed for ${niche} in ${city}`);
    } catch (err) {
        addLog(`Scraping failed: ${err.message}`);
    }
});

app.post('/api/send-email', async (req, res) => {
    const { smtpConfig, template, leadId } = req.body;
    addLog(`Starting email outreach...`);

    res.json({ message: 'Outreach started' });

    try {
        await runMailer(smtpConfig, template, leadId);
        addLog(`Outreach completed`);
    } catch (err) {
        addLog(`Outreach failed: ${err.message}`);
    }
});

app.get('/api/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(LOGS_FILE, 'utf8').split('\n').filter(Boolean).slice(-50);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read logs' });
    }
});

app.post('/api/leads/export', (req, res) => {
    try {
        const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
        const csv = [
            'Name,Company,Email,Website,Location,Status',
            ...leads.map(l => `"${l.name}","${l.company}","${l.email}","${l.website}","${l.city}","${l.status}"`)
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.send(csv);
    } catch (e) {
        res.status(500).json({ error: 'Export failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    addLog('System initialized');
});
