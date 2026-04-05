import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const statusStyles = {
  Submitted:  { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  Assigned:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  InProgress: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  Resolved:   { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  Rejected:   { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E' },
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 16, padding: '20px 24px',
    borderLeft: `4px solid ${accent}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }}>
    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
    <p style={{ fontSize: 30, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{sub}</p>}
  </div>
);

const DeptAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const deptId = user?.department?._id || user?.department;
  const deptName = user?.department?.name || 'Your Department';

  const loadData = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/api/v1/complaints/department'),
        api.get('/api/v1/departments'),
      ]);
      setComplaints(cRes.data.data);
      const myDept = dRes.data.data.find(d => d._id === deptId);
      if (myDept) setOfficers(myDept.officers || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const addOfficer = async () => {
    if (!newEmail.trim()) return;
    try {
      await api.post(`/api/v1/departments/${deptId}/officers`, { email: newEmail });
      setMsg({ text: 'Officer added successfully', type: 'success' });
      setNewEmail('');
      loadData();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add officer', type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const removeOfficer = async (officerId) => {
    if (!window.confirm('Remove this officer from your department?')) return;
    await api.delete(`/api/v1/departments/${deptId}/officers/${officerId}`);
    setOfficers(prev => prev.filter(o => o._id !== officerId));
    setMsg({ text: 'Officer removed', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const filtered = statusFilter ? complaints.filter(c => c.status === statusFilter) : complaints;

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    inProgress: complaints.filter(c => c.status === 'InProgress').length,
    submitted: complaints.filter(c => c.status === 'Submitted').length,
  };

  const chartData = ['Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'].map(s => ({
    name: s === 'InProgress' ? 'In Progress' : s,
    count: complaints.filter(c => c.status === s).length,
  }));

  const navItems = [
    { key: 'overview', icon: '▦', label: 'Overview' },
    { key: 'complaints', icon: '≡', label: 'Complaints' },
    { key: 'officers', icon: '◎', label: 'Officers' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0F172A', position: 'fixed',
        top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 50,
      }}>
        <div style={{ padding: '28px 24px 24px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px' }}>CivicConnect</div>
          <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.15)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Dept Admin
          </div>
        </div>

        <nav style={{ padding: '0 12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 2, fontSize: 13, fontWeight: 500, textAlign: 'left',
              background: tab === item.key ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: tab === item.key ? '#93C5FD' : '#64748B',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#93C5FD' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{deptName}</p>
            </div>
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }} style={{
            fontSize: 12, color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>Sign out →</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {navItems.find(n => n.key === tab)?.label}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{deptName}</p>
        </div>

        {msg.text && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 13, fontWeight: 500,
            background: msg.type === 'success' ? '#F0FDF4' : '#FFF1F2',
            color: msg.type === 'success' ? '#15803D' : '#BE123C',
            border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECDD3'}`,
          }}>
            {msg.text}
          </div>
        )}

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Complaints" value={stats.total} accent="#3B82F6" />
              <StatCard label="Resolved" value={stats.resolved}
                sub={`${stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate`}
                accent="#22C55E" />
              <StatCard label="In Progress" value={stats.inProgress} accent="#F97316" />
              <StatCard label="Pending" value={stats.submitted} accent="#94A3B8" />
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Complaints by status</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13, fontFamily: 'DM Sans' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Officers ({officers.length})</p>
                <button onClick={() => setTab('officers')} style={{ fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Manage →</button>
              </div>
              {officers.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94A3B8' }}>No officers assigned yet.</p>
              ) : officers.map(o => (
                <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>
                    {o.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: 0 }}>{o.name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{o.email}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F0FDF4', color: '#15803D', fontWeight: 600 }}>Active</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Complaints ── */}
        {tab === 'complaints' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {['', 'Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                  borderColor: statusFilter === s ? '#3B82F6' : '#E2E8F0',
                  background: statusFilter === s ? '#3B82F6' : '#fff',
                  color: statusFilter === s ? '#fff' : '#64748B',
                }}>
                  {s || 'All'} ({s ? complaints.filter(c => c.status === s).length : complaints.length})
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', background: '#fff', borderRadius: 16 }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', background: '#fff', borderRadius: 16, fontSize: 13 }}>No complaints found.</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['Complaint', 'Citizen', 'Officer', 'Status', 'Date', ''].map(h => (
                        <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const s = statusStyles[c.status] || statusStyles.Submitted;
                      return (
                        <tr key={c._id}
                          style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '13px 20px' }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: 0 }}>{c.title}</p>
                            <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{c.category}</p>
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{c.citizen?.name || '—'}</td>
                          <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{c.assignedTo?.name || '—'}</td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '13px 20px' }}>
                            <Link to={`/complaint/${c._id}`} style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500, textDecoration: 'none' }}>View →</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Officers ── */}
        {tab === 'officers' && (
          <>
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Add new officer</p>
              <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>The user must already have a registered citizen account.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder="officer@example.com"
                  onKeyDown={e => e.key === 'Enter' && addOfficer()}
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', color: '#0F172A', fontFamily: 'DM Sans' }} />
                <button onClick={addOfficer} style={{
                  padding: '10px 22px', background: '#0F172A', color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans',
                }}>Add Officer</button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Current officers ({officers.length})</p>
              </div>
              {officers.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No officers yet. Add one above.</div>
              ) : officers.map((o, i) => (
                <div key={o._id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px',
                  borderBottom: i < officers.length - 1 ? '1px solid #F8FAFC' : 'none',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1D4ED8', flexShrink: 0 }}>
                    {o.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{o.name}</p>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>{o.email}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#15803D', fontWeight: 600, marginRight: 8 }}>Active</span>
                  <button onClick={() => removeOfficer(o._id)} style={{
                    fontSize: 12, padding: '7px 14px', border: '1px solid #FECDD3',
                    borderRadius: 8, color: '#F43F5E', background: '#FFF1F2', cursor: 'pointer', fontWeight: 500, fontFamily: 'DM Sans',
                  }}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DeptAdminDashboard;
