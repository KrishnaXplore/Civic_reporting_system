import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../common/StatCard';
import { calcResolutionRate, formatCurrency } from '../../utils/helpers';
import api from '../../api/axios';

const PIE_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#F43F5E'];

const handleExport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const url = `/api/v1/admin/export${params ? `?${params}` : ''}`;
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `complaints-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    alert('Export failed. Please try again.');
  }
};

const OverviewTab = ({ stats, departments }) => {
  if (!stats) return null;

  const pieData = stats.byDept?.filter((d) => d.name && d.count > 0).map((d) => ({
    name: d.name, value: d.count,
  })) || [];

  return (
    <>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div />
        <button
          onClick={() => handleExport()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Citizens" value={stats.totalCitizens} accent="#3B82F6" />
        <StatCard label="Total Complaints" value={stats.totalComplaints} accent="#A855F7" />
        <StatCard label="Resolved" value={stats.resolved}
          sub={`${calcResolutionRate(stats.resolved, stats.totalComplaints)}% rate`} accent="#22C55E" />
        <StatCard label="In Progress" value={stats.inProgress} accent="#F97316" />
        <StatCard label="Funds Spent" value={(stats.totalFunds || 0).toLocaleString()} prefix="₹" accent="#F43F5E" />
        {stats.avgResolutionDays != null && (
          <StatCard label="Avg Resolution" value={stats.avgResolutionDays} sub="days" accent="#06B6D4" />
        )}
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
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{formatCurrency(stats.totalFunds)}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewTab;
