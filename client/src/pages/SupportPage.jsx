import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { createTicketApi, getMyTicketsApi } from '../api/support.api';

const FAQ = [
  { q: 'How do I submit a complaint?', a: 'Register an account, click "Report New Issue" from your dashboard, fill in the details, pick a location on the map, and upload a photo.' },
  { q: 'How long does resolution take?', a: 'Resolution time depends on the department and issue type. You can track progress in real time from your dashboard.' },
  { q: 'Why was my complaint rejected?', a: 'Complaints are rejected if the image is AI-generated, the complaint is a duplicate of an existing one, or it violates our guidelines.' },
  { q: 'What is the trust score?', a: 'Your trust score reflects your reporting history. Submitting fake or duplicate complaints reduces your score and may lead to account restrictions.' },
  { q: 'Can I report anonymously?', a: 'No. All complaints require a verified account to ensure accountability and prevent abuse.' },
];

const SupportPage = () => {
  const { user } = useAuth();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general' });
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      getMyTicketsApi().then(({ data }) => setMyTickets(data.data || [])).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError('Please log in to submit a support ticket.');
    setLoading(true);
    setError('');
    try {
      await createTicketApi(form);
      setDone(true);
      setForm({ subject: '', message: '', category: 'general' });
      getMyTicketsApi().then(({ data }) => setMyTickets(data.data || [])).catch(() => {});
    } catch {
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = { open: '#3B82F6', inProgress: '#F97316', resolved: '#22C55E', closed: '#94A3B8' };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.6px', marginBottom: 6 }}>Support</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 40 }}>Find answers to common questions or contact our team.</p>

        {/* FAQ */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
              <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)} style={{
                width: '100%', padding: '16px 28px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.q}</span>
                <span style={{ fontSize: 18, color: '#94A3B8', flexShrink: 0, marginLeft: 12 }}>{openFAQ === i ? '−' : '+'}</span>
              </button>
              {openFAQ === i && (
                <div style={{ padding: '0 28px 16px', fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Contact Support</h2>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24 }}>Can't find your answer? Send us a message.</p>

          {done && (
            <div style={{ padding: '12px 16px', background: '#F0FDF4', color: '#15803D', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 20, border: '1px solid #BBF7D0' }}>
              Ticket submitted! We'll get back to you soon.
            </div>
          )}
          {error && (
            <div style={{ padding: '12px 16px', background: '#FFF1F2', color: '#BE123C', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 20, border: '1px solid #FECDD3' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Subject *</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief subject"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'DM Sans', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                  <option value="general">General</option>
                  <option value="complaint">Complaint Issue</option>
                  <option value="technical">Technical Problem</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Message *</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'DM Sans', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '11px 28px', background: loading ? '#94A3B8' : '#0F172A', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans',
            }}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>

        {/* My tickets */}
        {user && myTickets.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #F1F5F9' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>My Tickets</h2>
            </div>
            {myTickets.map((t, i) => (
              <div key={t._id} style={{ padding: '16px 28px', borderBottom: i < myTickets.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>{t.subject}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{t.category} · {new Date(t.createdAt).toLocaleDateString()}</p>
                    {t.adminReply && (
                      <p style={{ fontSize: 13, color: '#475569', marginTop: 8, background: '#F8FAFC', padding: '8px 12px', borderRadius: 8 }}>
                        <strong>Reply:</strong> {t.adminReply}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${statusColor[t.status]}22`, color: statusColor[t.status], flexShrink: 0, marginLeft: 12 }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
