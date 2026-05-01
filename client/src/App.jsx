import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Mail, 
  Search, 
  Send, 
  ShieldCheck,
  Settings,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const API_URL = '/api';

function App() {
  const [leads, setLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [smtpConfig, setSmtpConfig] = useState({ email: '', password: '', senderName: '' });
  const [filters, setFilters] = useState({ country: 'USA', city: '', niche: 'SaaS', role: 'Founder' });
  const [template, setTemplate] = useState({
    subject: 'Collaboration with {{company}}',
    body: 'Hi {{name}},\n\nI saw {{company}} and love what you are building. I would love to discuss a potential collaboration.\n\nBest,\nYour Name'
  });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_URL}/leads`);
      setLeads(res.data);
    } catch (err) { console.error('Error fetching leads'); }
  };

  const startScraping = async () => {
    setIsScraping(true);
    try {
      await axios.post(`${API_URL}/scrape`, filters);
      setTimeout(fetchLeads, 3000);
    } catch (err) { alert('Failed to start scraping'); }
    finally { setIsScraping(false); }
  };

  const sendEmail = async (leadId = null) => {
    if (!smtpConfig.email || !smtpConfig.password) return alert('Configure SMTP in settings first');
    try {
      await axios.post(`${API_URL}/send-email`, { smtpConfig, template, leadId });
      alert(leadId ? 'Email sent!' : 'Bulk send started!');
      setTimeout(fetchLeads, 2000);
    } catch (err) { alert('Error sending email'); }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <ShieldCheck size={24} />
          Hanzala Outreach
        </div>
        <nav>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
            <Users size={18} /> Leads
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /> Settings
          </div>
        </nav>
      </aside>

      {/* Main Container */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        {/* Header */}
        <header className="header">
          <div className="header-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div className="badge badge-green">System Live</div>
            <div style={{width: '32px', height: '32px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <User size={18} color="#6B7280" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <>
              {/* 1. Lead Generation Panel */}
              <div className="card">
                <h3 className="card-title"><Search size={18} color="#2563EB" /> Find Targeted Leads</h3>
                <div className="grid">
                  <div>
                    <label>Niche / Industry</label>
                    <input value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})} placeholder="e.g. Restaurants" />
                  </div>
                  <div>
                    <label>Role</label>
                    <input value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})} placeholder="e.g. Founder" />
                  </div>
                  <div>
                    <label>Country</label>
                    <input value={filters.country} onChange={e => setFilters({...filters, country: e.target.value})} />
                  </div>
                  <div>
                    <label>City (Optional)</label>
                    <input value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} placeholder="e.g. New York" />
                  </div>
                </div>
                <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                  <button className="primary" onClick={startScraping} disabled={isScraping}>
                    {isScraping ? 'Searching...' : 'Find Leads'} <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* 2. Leads Table & 3. Email Composer */}
              <div style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px'}}>
                <div>
                  <div className="card" style={{minHeight: '400px'}}>
                    <h3 className="card-title"><Users size={18} color="#2563EB" /> Recent Leads</h3>
                    <table style={{marginTop: '10px'}}>
                      <thead>
                        <tr>
                          <th>Name / Role</th>
                          <th>Company</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice(0, 5).map(lead => (
                          <tr key={lead.id}>
                            <td>
                              <div style={{fontWeight: 500}}>{lead.name}</div>
                              <div style={{fontSize: '12px', color: '#6B7280'}}>{lead.email}</div>
                            </td>
                            <td>{lead.company}</td>
                            <td>
                              <span className={`badge ${lead.status === 'Sent' ? 'badge-green' : 'badge-grey'}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td>
                              <button className="secondary" style={{padding: '6px 10px'}} onClick={() => sendEmail(lead.id)}>Send</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                  {/* Email Composer */}
                  <div className="card">
                    <h3 className="card-title"><Mail size={18} color="#2563EB" /> Email Composer</h3>
                    <div>
                      <label>Subject Line</label>
                      <input value={template.subject} onChange={e => setTemplate({...template, subject: e.target.value})} style={{marginBottom: '16px'}} />
                      <label>Message Body</label>
                      <textarea 
                        value={template.body} 
                        onChange={e => setTemplate({...template, body: e.target.value})}
                        style={{minHeight: '180px', marginBottom: '16px'}}
                      />
                      <div style={{display: 'flex', gap: '10px'}}>
                        <button className="primary" style={{flex: 1}} onClick={() => sendEmail()}>Send to All</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Activity Logs */}
              <div className="card">
                <h3 className="card-title"><Clock size={18} color="#2563EB" /> Activity Feed</h3>
                <div className="logs-list">
                  <div className="log-item">
                    <span>System initialized and connected to Supabase</span>
                    <span className="log-time">Just now</span>
                  </div>
                  {leads.filter(l => l.status === 'Sent').slice(0, 3).map(l => (
                    <div className="log-item" key={l.id}>
                      <span>Email sent to {l.email}</span>
                      <span className="log-time">{new Date(l.sent_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'leads' && (
            <div className="card">
              <h3 className="card-title">All Leads ({leads.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Validation</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.company}</td>
                      <td>{lead.email}</td>
                      <td>
                        <span className={`badge ${lead.validation_status === 'Valid' ? 'badge-green' : 'badge-yellow'}`}>
                          {lead.validation_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${lead.status === 'Sent' ? 'badge-green' : 'badge-grey'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td>
                        <button className="secondary" style={{padding: '6px 10px'}} onClick={() => sendEmail(lead.id)}>Send</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card" style={{maxWidth: '600px'}}>
              <h3 className="card-title"><Settings size={18} color="#2563EB" /> SMTP Configuration</h3>
              <p style={{fontSize: '14px', color: '#6B7280', marginBottom: '20px'}}>Configure your Gmail App Password to enable outreach.</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div>
                  <label>Gmail Address</label>
                  <input value={smtpConfig.email} onChange={e => setSmtpConfig({...smtpConfig, email: e.target.value})} placeholder="yourname@gmail.com" />
                </div>
                <div>
                  <label>App Password</label>
                  <input type="password" value={smtpConfig.password} onChange={e => setSmtpConfig({...smtpConfig, password: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" />
                </div>
                <div>
                  <button className="primary" onClick={() => alert('Settings Saved!')}>Save Configuration</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
