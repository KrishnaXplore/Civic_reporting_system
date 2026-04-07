import Navbar from '../components/common/Navbar';
import { useDepartments } from '../hooks/useDepartments';

const DEPT_ICONS = {
  'Roads & Infrastructure': '🛣️',
  'Water & Sanitation':     '💧',
  'Electricity':            '⚡',
  'Waste Management':       '♻️',
  'Parks & Public Spaces':  '🌳',
};

const DepartmentsPage = () => {
  const { departments, loading } = useDepartments();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.6px', marginBottom: 6 }}>Departments</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 40 }}>All civic departments and their current status.</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Loading departments...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {departments.map((d) => (
              <div key={d._id} style={{
                background: '#fff', borderRadius: 16, padding: '24px 28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
              }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{DEPT_ICONS[d.name] || '🏛️'}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{d.name}</h3>
                {d.description && (
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 1.5 }}>{d.description}</p>
                )}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Admin</p>
                    <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, margin: 0 }}>{d.admin?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 3px' }}>Officers</p>
                    <p style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, margin: 0 }}>{d.officers?.length || 0}</p>
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                    background: d.officers?.length > 0 ? '#F0FDF4' : '#F8FAFC',
                    color: d.officers?.length > 0 ? '#15803D' : '#94A3B8',
                  }}>
                    {d.officers?.length > 0 ? 'Active' : 'No officers'}
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

export default DepartmentsPage;
