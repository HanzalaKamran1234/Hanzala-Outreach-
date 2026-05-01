# Hanzala Outreach

A complete, production-ready lead generation and email outreach automation tool.

## Features
- **Targeted Lead Scraping**: Find businesses by country, city, niche, and role.
- **Email Validation**: MX and SMTP-based validation to ensure deliverability.
- **Modern Dashboard**: Sleek React UI for managing leads and campaigns.
- **Custom Templates**: Support for `{{name}}` and `{{company}}` placeholders.
- **SMTP Integration**: Send emails using your own Gmail credentials (via App Password).
- **Activity Logs**: Real-time tracking of scraping and sending processes.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   cd client
   npm install
   ```

2. **Configure Gmail**:
   - Go to your Google Account Settings.
   - Enable 2-Step Verification.
   - Search for "App Passwords".
   - Generate a new password for "Mail".

3. **Run the Application**:
   - Return to the root directory.
   - Run: `npm run dev`
   - Access the dashboard at `http://localhost:5173`.

## System Architecture
- **Backend**: Node.js + Express (Server), Puppeteer/Search (Scraper), Nodemailer (Outreach).
- **Frontend**: React + Vite (Dashboard), Vanilla CSS (Design).
- **Data**: JSON-based persistence in the `db/` directory.

## Rules
- Strictly rule-based scraping based on user filters.
- No duplicate leads allowed.
- Progressive logs for all operations.

---
Built by Antigravity for high-performance outreach.
