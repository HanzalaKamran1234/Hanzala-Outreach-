const nodemailer = require('nodemailer');
const { supabase } = require('./supabase');

async function runMailer(smtpConfig, template, targetLeadId = null) {
    console.log(`🚀 [Supabase] Starting outreach...`);

    let query = supabase.from('leads').select('*');
    
    if (targetLeadId) {
        query = query.eq('id', targetLeadId);
    } else {
        query = query.eq('status', 'Not Contacted');
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError || !leads || leads.length === 0) {
        console.log("No leads to process.");
        return;
    }

    console.log(`Starting outreach to ${leads.length} leads...`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpConfig.email,
            pass: smtpConfig.password
        }
    });

    for (const lead of leads) {
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
            
            // Update lead status in Supabase
            await supabase
                .from('leads')
                .update({ status: 'Sent', sent_at: new Date().toISOString() })
                .eq('id', lead.id);

            console.log(`[✓] Sent to: ${lead.email}`);

            // Delay to avoid spam filters if sending multiple
            if (leads.length > 1) {
                const delay = 5000 + Math.random() * 5000;
                await new Promise(r => setTimeout(r, delay));
            }
        } catch (err) {
            console.error(`[✗] Failed for ${lead.email}:`, err.message);
            await supabase
                .from('leads')
                .update({ status: 'Failed', error: err.message })
                .eq('id', lead.id);
        }
    }
}

module.exports = { runMailer };
