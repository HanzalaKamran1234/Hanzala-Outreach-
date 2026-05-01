import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Mail, 
  Settings, 
  LayoutDashboard, 
  Search, 
  Send, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCcw,
  Download,
  Terminal
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  
  const [filters, setFilters] = useState({
    country: 'USA',
    city: 'Miami',
    niche: 'Real Estate',
    role: 'Founder',
    targetCount: 10
  });

  const [smtpConfig, setSmtpConfig] = useState({
    email: '',
    password: '',
    senderName: ''
  });

  const [template, setTemplate] = useState({
    subject: 'Interested in working with {{company}}',
    body: 'Hi {{name}},\n\nI saw {{company}} and was impressed by your work. I wanted to reach out and see if you need any help with digital outreach.\n\nBest,\nYour Name'
  });

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_URL}/leads`);
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to fetch leads');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs');
    }
  };

  const startScraping = async () => {
    setIsScraping(true);
    try {
      await axios.post(`${API_URL}/scrape`, filters);
      setTimeout(fetchLeads, 2000);
    } catch (err) {
      alert('Scraping failed to start');
    } finally {
      setIsScraping(false);
    }
  };

  const sendEmail = async (leadId = null) => {
    if (!smtpConfig.email || !smtpConfig.password) {
      alert('Please configure your SMTP settings first');
      setActiveTab('settings');
      return;
    }

    try {
      await axios.post(`${API_URL}/send-email`, {
        smtpConfig,
        template,
        leadId
      });
      alert(leadId ? 'Email sending triggered' : 'Bulk outreach started');
      setTimeout(fetchLeads, 2000);
    } catch (err) {
      alert('Failed to send email');
    }
  };

  const exportLeads = () => {
    window.open(`${API_URL}/leads/export`);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo">HANZALA OUTREACH</div>
          <p style={{color: 'var(--text-muted)', fontSize: '12px'}}>Elite Lead Gen Engine</p>
        </div>
        
        <nav style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
            <Users size={20} /> Leads Table
          </div>
          <div className={`nav-item ${activeTab === 'scrape' ? 'active' : ''}`} onClick={() => setActiveTab('scrape')}>
            <Search size={20} /> Scraper Engine
          </div>
          <div className={`nav-item ${activeTab === 'template' ? 'active' : ''}`} onClick={() => setActiveTab('template')}>
            <FileText size={20} /> Email Template
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> SMTP Config
          </div>
        </nav>

        <div style={{marginTop: 'auto'}}>
          <div className="card" style={{padding: '12px', background: 'rgba(99, 102, 241, 0.05)'}}>
            <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>System Status</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
              <div style={{width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%'}}></div>
              <span style={{fontSize: '14px'}}>Connected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
          <div>
            <h1 style={{fontSize: '28px'}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p style={{color: 'var(--text-muted)'}}>Manage your outreach campaign effectively</p>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            <button className="secondary" onClick={fetchLeads}>
              <RefreshCcw size={18} /> Refresh
            </button>
            <button className="primary" onClick={exportLeads}>
              <Download size={18} /> Export CSV
            </button>
          </div>
        </header>

        {activeTab === 'leads' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 className="card-title"><LayoutDashboard size={20} /> All Scraped Leads</h3>
              <button className="primary" onClick={() => sendEmail()}>
                <Send size={18} /> Send to All
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name / Role</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{lead.company}</td>
                    <td>{lead.email}</td>
                    <td>
                      <a href={lead.website} target="_blank" rel="noreferrer" style={{color: 'var(--primary)', textDecoration: 'none'}}>
                        {lead.website !== 'None' ? 'Visit Site' : 'No Site'}
                      </a>
                    </td>
                    <td>
                      <span className={`status-pill status-${lead.status.toLowerCase().replace(' ', '-')}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <button className="secondary" style={{padding: '6px 12px', fontSize: '12px'}} onClick={() => sendEmail(lead.id)}>
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'scrape' && (
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title"><Search size={20} /> Lead Generation Filters</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Industry / Niche</label>
                  <input value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})} placeholder="e.g. SaaS, Dental, Law" />
                </div>
                <div className="grid-2">
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Country</label>
                    <input value={filters.country} onChange={e => setFilters({...filters, country: e.target.value})} />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>City</label>
                    <input value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Target Role</label>
                  <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}>
                    <option>Founder</option>
                    <option>Decision Maker</option>
                    <option>Developer</option>
                    <option>Marketing Manager</option>
                  </select>
                </div>
                <div>
                  <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Number of Leads</label>
                  <input type="number" value={filters.targetCount} onChange={e => setFilters({...filters, targetCount: parseInt(e.target.value)})} />
                </div>
                <button className="primary" style={{width: '100%', justifyContent: 'center'}} onClick={startScraping} disabled={isScraping}>
                  {isScraping ? 'Scraping in Progress...' : 'Start Scraping'}
                </button>
              </div>
            </div>
            
            <div className="card">
              <h3 className="card-title"><Terminal size={20} /> Live Activity Logs</h3>
              <div className="logs-container">
                {logs.map((log, i) => (
                  <div key={i} style={{marginBottom: '4px'}}>{log}</div>
                ))}
                {logs.length === 0 && <div style={{color: '#666'}}>Waiting for activity...</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="card">
            <h3 className="card-title"><Mail size={20} /> Email Outreach Template</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Subject Line</label>
                <input value={template.subject} onChange={e => setTemplate({...template, subject: e.target.value})} />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Email Body</label>
                <textarea 
                  rows={10} 
                  value={template.body} 
                  onChange={e => setTemplate({...template, body: e.target.value})}
                  style={{resize: 'none'}}
                />
                <p style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px'}}>
                  Use placeholders: <b>&#123;&#123;name&#125;&#125;</b>, <b>&#123;&#123;company&#125;&#125;</b>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card" style={{maxWidth: '600px'}}>
            <h3 className="card-title"><Settings size={20} /> SMTP Configuration</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={{background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger)', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '13px'}}>
                <b>Note:</b> Use a Gmail App Password for secure sending.
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Sender Name</label>
                <input value={smtpConfig.senderName} onChange={e => setSmtpConfig({...smtpConfig, senderName: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>Gmail Address</label>
                <input value={smtpConfig.email} onChange={e => setSmtpConfig({...smtpConfig, email: e.target.value})} placeholder="yourname@gmail.com" />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontSize: '14px'}}>App Password</label>
                <input type="password" value={smtpConfig.password} onChange={e => setSmtpConfig({...smtpConfig, password: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" />
              </div>
              <button className="primary" onClick={() => alert('Configuration Saved')}>
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
