const StatCard = ({ label, value, sub, accent = '#3B82F6', prefix = '', suffix = '' }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    padding: '22px 24px',
    borderTop: `3px solid ${accent}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }}>
    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
      {label}
    </p>
    <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
      {prefix}{value}{suffix}
    </p>
    {sub && <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{sub}</p>}
  </div>
);

export default StatCard;
