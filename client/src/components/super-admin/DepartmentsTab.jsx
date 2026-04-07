const PIE_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#F43F5E'];

const DepartmentsTab = ({ departments, stats }) => (
  <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
          {['Department', 'Admin', 'Officers', 'Complaints', 'Status'].map((h) => (
            <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {departments.map((d, i) => {
          const deptStat = stats?.byDept?.find((bd) => bd.name === d.name);
          return (
            <tr key={d._id}
              style={{ borderBottom: i < departments.length - 1 ? '1px solid #F8FAFC' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <td style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{d.name}</span>
                </div>
              </td>
              <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{d.admin?.name || '—'}</td>
              <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{d.officers?.length || 0}</td>
              <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{deptStat?.count || 0}</td>
              <td style={{ padding: '14px 20px' }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: d.officers?.length > 0 ? '#F0FDF4' : '#F8FAFC', color: d.officers?.length > 0 ? '#15803D' : '#94A3B8', fontWeight: 600 }}>
                  {d.officers?.length > 0 ? 'Active' : 'No officers'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default DepartmentsTab;
