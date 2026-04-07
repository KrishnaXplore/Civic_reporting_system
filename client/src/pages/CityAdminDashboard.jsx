import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/common/Sidebar';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import api from '../api/axios';
import { formatDate, calcResolutionRate } from '../utils/helpers';

const NAV = [
  { key: 'overview',   icon: '▦', label: 'Overview' },
  { key: 'complaints', icon: '≡', label: 'Complaints' },
];

const CityAdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const city = user?.jurisdiction?.city || '';
  const state = user?.jurisdiction?.state || '';

  useEffect(() => {
    if (!city && !state) { setLoading(false); return; }
    api.get('/api/v1/admin/stats/location', { params: { city, state } })
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, state]);

  const chartData = data?.byCategory?.map((c) => ({ name: c.name, count: c.count })) || [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <Sidebar navItems={NAV} activeTab={tab} onTabChange={setTab} accentColor="#10B981" roleLabel="City Admin" />

      <main style={{ marginLeft: 240, flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {city || 'City'} Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{state} · City-wide complaint management</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Loading...</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, color: '#94A3B8', fontSize: 14 }}>
            No jurisdiction configured. Contact your super admin.
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
                  <StatCard label="Total Complaints" value={data.total} accent="#10B981" />
                  <StatCard label="Resolved" value={data.resolved}
                    sub={`${calcResolutionRate(data.resolved, data.total)}% rate`} accent="#22C55E" />
                  <StatCard label="In Progress" value={data.inProgress} accent="#F97316" />
                  <StatCard label="Pending" value={data.submitted} accent="#94A3B8" />
                  {data.avgResolutionDays != null && (
                    <StatCard label="Avg Resolution" value={data.avgResolutionDays} sub="days" accent="#06B6D4" />
                  )}
                </div>

                <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Complaints by category</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 13 }} />
                      <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {tab === 'complaints' && (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {['Title', 'Category', 'Ward', 'Status', 'Date'].map((h) => (
                        <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recentComplaints || []).map((c, i) => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F8FAFC' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '13px 20px', fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{c.title}</td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#64748B' }}>{c.category}</td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8' }}>{c.locationDetails?.ward || '—'}</td>
                        <td style={{ padding: '13px 20px' }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8' }}>{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CityAdminDashboard;
