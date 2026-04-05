import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#F43F5E'];

const statusStyles = {
  Submitted:  { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  Assigned:   { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  InProgress: { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  Resolved:   { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  Rejected:   { bg: '#FFF1F2', color: '#BE123C', dot: '#F43F5E' },
};

const StatCard = ({ label, value, sub, accent, prefix = '', suffix = '' }) => (
  <div style={{
    background: '#fff', borderRadius: 16, padding: '22px 24px',
    borderTop: `3px solid ${accent}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }}>
    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</p>
    <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{prefix}{value}{suffix}</p>
    {sub && <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{sub}</p>}
  </div>
);

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      const [sRes, fRes, dRes] = await Promise.all([
        api.get('/api/v1/admin/stats'),
        api.get('/api/v1/admin/flagged-users'),
        api.get('/api/v1/departments'),
      ]);
      setStats(sRes.data.data);
      setFlagged(fRes.data.data);
      setDepartments(dRes.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const banUser = async (id) => {
    if (!window.confirm('Ban this user? They will lose access immediately.')) return;
    await api.put(`/api/v1/admin/users/${id}/ban`);
    setFlagged(prev => prev.filter(u => u._id !== id));
    setMsg({ text: 'User banned successfully', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const clearStrikes = async (id) => {
    await api.put(`/api/v1/admin/users/${id}/clear-strikes`);
    setFlagged(prev => prev.filter(u => u._id !== id));
    setMsg({ text: 'Strikes cleared', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const pieData = stats?.byDept?.filter(d => d.name && d.count > 0).map(d => ({
    name: d.name, value: d.count,
  })) || [];

  const navItems = [
    { key: 'overview',    icon: '▦', label: 'Overview' },
    { key: 'departments', icon: '◫', label: 'Departments' },
    { key: 'flagged',     icon: '⚑', label: `Flagged (${flagged.length})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0F172A', position: 'fixed',
        top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 50,
      }}>
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px' }}>CivicConnect</div>
          <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 600, color: '#A855F7', background: 'rgba(168,85,247,0.15)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Super Admin
          </div>
        </div>

        <nav style={{ padding: '0 12px', flex: 1 }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 2, fontSize: 13, fontWeight: 500, textAlign: 'left',
              background: tab === item.key ? 'rgba(168,85,247,0.15)' : 'transparent',
              color: tab === item.key ? '#C4B5FD' : '#64748B',
              transition: 'all 0.15s',
            }}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#C4B5FD' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>Super Admin</p>
            </div>
          </div>
          <button onClick={async () => { await logout(); navigate('/login'); }} style={{
            fontSize: 12, color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>Sign out →</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {navItems.find(n => n.key === tab)?.label?.replace(/\s*\(\d+\)/, '')}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>System-wide administration panel</p>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Loading...</div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && stats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
                  <StatCard label="Total Citizens" value={stats.totalCitizens} accent="#3B82F6" />
                  <StatCard label="Total Complaints" value={stats.totalComplaints} accent="#A855F7" />
                  <StatCard label="Resolved" value={stats.resolved}
                    sub={`${stats.totalComplaints ? Math.round((stats.resolved / stats.totalComplaints) * 100) : 0}% rate`}
                    accent="#22C55E" />
                  <StatCard label="In Progress" value={stats.inProgress} accent="#F97316" />
                  <StatCard label="Funds Spent" value={(stats.totalFunds || 0).toLocaleString()} prefix="₹" accent="#F43F5E" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Complaints by department</p>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#64748B' }}>{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>No data yet</div>
                    )}
                  </div>

                  <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Department summary</p>
                    {stats.byDept?.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < stats.byDept.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: '#475569' }}>{d.name || 'Unassigned'}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{d.count}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>Total funds spent</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>₹{(stats.totalFunds || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Departments ── */}
            {tab === 'departments' && (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['Department', 'Admin', 'Officers', 'Open Complaints', 'Resolved'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d, i) => {
                      const deptComplaints = stats?.byDept?.find(bd => bd.name === d.name);
                      return (
                        <tr key={d._id}
                          style={{ borderBottom: i < departments.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{d.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{d.admin?.name || '—'}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{d.officers?.length || 0}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{deptComplaints?.count || 0}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#15803D', fontWeight: 600 }}>
                              {d.officers?.length > 0 ? 'Active' : 'No officers'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Flagged Users ── */}
            {tab === 'flagged' && (
              <>
                {flagged.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#15803D' }}>No flagged users</p>
                    <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>All accounts are in good standing.</p>
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FFF7ED' }}>
                      <p style={{ fontSize: 13, color: '#C2410C', fontWeight: 500, margin: 0 }}>
                        {flagged.length} account{flagged.length !== 1 ? 's' : ''} require{flagged.length === 1 ? 's' : ''} review — these users have 3 or more image strikes.
                      </p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          {['User', 'Email', 'Strikes', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {flagged.map((u, i) => (
                          <tr key={u._id}
                            style={{ borderBottom: i < flagged.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#F43F5E' }}>
                                  {u.name?.[0]?.toUpperCase()}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{u.email}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#F43F5E' }}>{u.strikeCount}</span>
                              <span style={{ fontSize: 12, color: '#94A3B8' }}> / 5</span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#FFF7ED', color: '#C2410C', fontWeight: 600 }}>
                                {u.status === 'warned' ? 'Warned' : 'Flagged'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => clearStrikes(u._id)} style={{
                                  fontSize: 12, padding: '6px 12px', border: '1px solid #E2E8F0',
                                  borderRadius: 8, color: '#475569', background: '#fff', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500,
                                }}>Clear Strikes</button>
                                <button onClick={() => banUser(u._id)} style={{
                                  fontSize: 12, padding: '6px 12px', border: 'none',
                                  borderRadius: 8, color: '#fff', background: '#F43F5E', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600,
                                }}>Ban</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
