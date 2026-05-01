import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Mail, 
  Search, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Download,
  ShieldCheck,
  Settings
} from 'lucide-react';

const API_URL = '/api';

function App() {
  const [leads, setLeads] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({ email: '', password: '', senderName: '' });
  const [filters, setFilters] = useState({ country: 'USA', city: '', niche: 'SaaS', role: 'Founder', targetCount: 5 });
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

  const exportLeads = () => { window.open(`${API_URL}/leads/export`); };

  return (
    <div className="app-container" style={{background: '#0f172a', minHeight: '100vh', padding: '20px'}}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px'}}>
        <div className="logo" style={{fontSize: '24px', fontWeight: 'bold', color: '#6366f1'}}>HANZALA OUTREACH</div>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="secondary" onClick={exportLeads}><Download size={18} /> Export</button>
          <button className="secondary" onClick={() => {
            const email = prompt('Enter Gmail:', smtpConfig.email);
            const pass = prompt('Enter App Password:', smtpConfig.password);
            if(email && pass) setSmtpConfig({...smtpConfig, email, password: pass});
          }}><Settings size={18} /> SMTP Setup</button>
        </div>
      </header>

      <div className="main-grid" style={{display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px'}}>
        {/* Section 1: Lead Input Panel */}
        <div className="card glass">
          <h3 className="card-title"><Search size={20} /> 1. Find Leads</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div>
              <label>Niche / Industry</label>
              <input value={filters.niche} onChange={e => setFilters({...filters, niche: e.target.value})} placeholder="e.g. Real Estate" />
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              <div>
                <label>Country</label>
                <input value={filters.country} onChange={e => setFilters({...filters, country: e.target.value})} />
              </div>
              <div>
                <label>City</label>
                <input value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} />
              </div>
            </div>
            <div>
              <label>Target Role</label>
              <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}>
                <option>Founder</option>
                <option>Owner</option>
                <option>Manager</option>
                <option>Developer</option>
              </select>
            </div>
            <button className="primary" onClick={startScraping} disabled={isScraping} style={{width: '100%', justifyContent: 'center'}}>
              {isScraping ? 'Finding Leads...' : 'Find Leads'}
            </button>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          {/* Section 2: Leads Table */}
          <div className="card glass" style={{flex: 1}}>
            <h3 className="card-title" style={{justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Users size={20} /> 2. Leads Table</div>
              <span style={{fontSize: '12px', fontWeight: 'normal', color: '#94a3b8'}}>{leads.length} leads found</span>
            </h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.company}</td>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                          {lead.email}
                          <span style={{
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            background: lead.validation_status === 'Valid' ? '#065f46' : '#92400e',
                            color: 'white'
                          }}>
                            {lead.validation_status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill status-${lead.status.toLowerCase().replace(' ', '-')}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td>
                        <button className="secondary" style={{padding: '5px 10px'}} onClick={() => sendEmail(lead.id)}>Send</button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>No leads found yet. Start by finding leads on the left.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Email Panel */}
          <div className="card glass">
            <h3 className="card-title" style={{justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Mail size={20} /> 3. Email Template</div>
              <button className="primary" onClick={() => sendEmail()}><Send size={16} /> Send to All Valid</button>
            </h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px'}}>
              <div>
                <label>Subject</label>
                <input value={template.subject} onChange={e => setTemplate({...template, subject: e.target.value})} style={{marginBottom: '15px'}} />
                <div style={{fontSize: '12px', color: '#94a3b8', background: '#1e293b', padding: '10px', borderRadius: '8px'}}>
                  <b>Placeholders:</b><br/>
                  &#123;&#123;name&#125;&#125;<br/>
                  &#123;&#123;company&#125;&#125;
                </div>
              </div>
              <textarea 
                value={template.body} 
                onChange={e => setTemplate({...template, body: e.target.value})}
                style={{minHeight: '150px', background: '#1e293b', border: 'none', color: 'white'}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
