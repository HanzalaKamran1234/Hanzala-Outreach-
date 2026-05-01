const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db');
const LEADS_FILE = path.join(DB_PATH, 'leads.json');

async function runMailer(smtpConfig, template, targetLeadId = null) {
    if (!fs.existsSync(LEADS_FILE)) {
        console.log("No leads found.");
        return;
    }

    let leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    
    // Filter leads to send to
    const leadsToProcess = targetLeadId 
        ? leads.filter(l => l.id === targetLeadId)
        : leads.filter(l => l.status === 'Not Contacted');

    if (leadsToProcess.length === 0) {
        console.log("No leads to process.");
        return;
    }

    console.log(`Starting outreach to ${leadsToProcess.length} leads...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password
        }
    });

    for (const lead of leadsToProcess) {
        try {
            // Replace placeholders
            let body = template.body
                .replace(/{{name}}/g, lead.name || 'Friend')
                .replace(/{{company}}/g, lead.company || 'your business');

            const mailOptions = {
                from: `"${smtpConfig.senderName || 'Outreach'}" <${smtpConfig.email}>`,
                to: lead.email,
                subject: template.subject,
                html: body,
                replyTo: smtpConfig.email
            };

            await transporter.sendMail(mailOptions);
            
            // Update lead status
            const index = leads.findIndex(l => l.id === lead.id);
            if (index !== -1) {
                leads[index].status = 'Sent';
                leads[index].sentAt = new Date().toISOString();
            }

            fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
            console.log(`[✓] Sent to: ${lead.email}`);

            // Delay to avoid spam filters if sending multiple
            if (leadsToProcess.length > 1) {
                const delay = 5000 + Math.random() * 5000;
                await new Promise(r => setTimeout(r, delay));
            }
        } catch (err) {
            console.error(`[✗] Failed for ${lead.email}:`, err.message);
            const index = leads.findIndex(l => l.id === lead.id);
            if (index !== -1) {
                leads[index].status = 'Failed';
                leads[index].error = err.message;
            }
            fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
        }
    }
}

module.exports = { runMailer };
