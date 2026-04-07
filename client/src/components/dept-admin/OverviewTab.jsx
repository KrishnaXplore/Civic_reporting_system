import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../common/StatCard';
import { calcResolutionRate } from '../../utils/helpers';

const OverviewTab = ({ complaints, officers, onManageOfficers }) => {
  const stats = {
    total:      complaints.length,
    resolved:   complaints.filter((c) => c.status === 'Resolved').length,
    inProgress: complaints.filter((c) => c.status === 'InProgress').length,
    submitted:  complaints.filter((c) => c.status === 'Submitted').length,
  };

  const chartData = ['Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'].map((s) => ({
    name: s === 'InProgress' ? 'In Progress' : s,
    count: complaints.filter((c) => c.status === s).length,
  }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Complaints" value={stats.total} accent="#3B82F6" />
        <StatCard label="Resolved" value={stats.resolved}
          sub={`${calcResolutionRate(stats.resolved, stats.total)}% rate`} accent="#22C55E" />
        <StatCard label="In Progress" value={stats.inProgress} accent="#F97316" />
        <StatCard label="Pending" value={stats.submitted} accent="#94A3B8" />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Complaints by status</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }} />
            <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Officers ({officers.length})</p>
          <button onClick={onManageOfficers} style={{ fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Manage →
          </button>
        </div>
        {officers.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>No officers assigned yet.</p>
        ) : officers.slice(0, 5).map((o) => (
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
  );
};

export default OverviewTab;
