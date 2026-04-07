import { useState, useEffect } from 'react';
import { getAllTicketsApi, updateTicketApi } from '../../api/support.api';

const STATUS_COLOR = { open: '#3B82F6', inProgress: '#F97316', resolved: '#22C55E', closed: '#94A3B8' };

const SupportTab = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAllTicketsApi(filter ? { status: filter } : {});
      setTickets(data.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleUpdate = async (id, updates) => {
    setSaving(true);
    try {
      await updateTicketApi(id, updates);
      await load();
      setActiveTicket(null);
      setReply('');
    } catch { }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'open', 'inProgress', 'resolved', 'closed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', border: '1px solid',
            borderColor: filter === s ? '#0F172A' : '#E2E8F0',
            background: filter === s ? '#0F172A' : '#fff',
            color: filter === s ? '#fff' : '#64748B',
          }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading...</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#94A3B8', fontSize: 13 }}>No support tickets found.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {tickets.map((t, i) => (
            <div key={t._id} style={{ padding: '16px 24px', borderBottom: i < tickets.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 3px' }}>{t.subject}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 6px' }}>
                    {t.citizen?.name} · {t.citizen?.email} · {t.category} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{t.message}</p>
                  {t.adminReply && (
                    <p style={{ fontSize: 13, color: '#0F172A', marginTop: 8, background: '#EFF6FF', padding: '8px 12px', borderRadius: 8 }}>
                      <strong>Your reply:</strong> {t.adminReply}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status] }}>
                    {t.status}
                  </span>
                  {t.status !== 'closed' && (
                    <button onClick={() => { setActiveTicket(t); setReply(t.adminReply || ''); }} style={{
                      fontSize: 12, padding: '5px 12px', border: '1px solid #E2E8F0',
                      borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#475569', fontWeight: 500,
                    }}>Reply</button>
                  )}
                </div>
              </div>

              {activeTicket?._id === t._id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder="Write your reply..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => handleUpdate(t._id, { adminReply: reply, status: 'resolved' })} disabled={saving} style={{
                      padding: '8px 16px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>Send & Resolve</button>
                    <button onClick={() => handleUpdate(t._id, { status: 'inProgress' })} disabled={saving} style={{
                      padding: '8px 16px', background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>Mark In Progress</button>
                    <button onClick={() => setActiveTicket(null)} style={{
                      padding: '8px 16px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTab;
