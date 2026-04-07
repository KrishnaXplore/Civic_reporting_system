const FlaggedUsersTab = ({ flagged, onBan, onClear }) => {
  if (flagged.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>✓</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#15803D' }}>No flagged users</p>
        <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>All accounts are in good standing.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #F1F5F9', background: '#FFF7ED' }}>
        <p style={{ fontSize: 13, color: '#C2410C', fontWeight: 500, margin: 0 }}>
          {flagged.length} account{flagged.length !== 1 ? 's' : ''} require{flagged.length === 1 ? 's' : ''} review — 3 or more image strikes.
        </p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
            {['User', 'Email', 'Strikes', 'Status', 'Actions'].map((h) => (
              <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flagged.map((u, i) => (
            <tr key={u._id}
              style={{ borderBottom: i < flagged.length - 1 ? '1px solid #F8FAFC' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
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
                  <button onClick={() => onClear(u._id)} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 8, color: '#475569', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    Clear Strikes
                  </button>
                  <button onClick={() => onBan(u._id)} style={{ fontSize: 12, padding: '6px 12px', border: 'none', borderRadius: 8, color: '#fff', background: '#F43F5E', cursor: 'pointer', fontWeight: 600 }}>
                    Ban
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FlaggedUsersTab;
