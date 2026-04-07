import { useState } from 'react';

const OfficersTab = ({ officers, deptId, onAdd, onRemove }) => {
  const [email, setEmail] = useState('');

  const handleAdd = () => {
    if (!email.trim()) return;
    onAdd(email);
    setEmail('');
  };

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Add new officer</p>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>The user must already have a registered citizen account.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="officer@example.com"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0F172A' }}
          />
          <button onClick={handleAdd} style={{
            padding: '10px 22px', background: '#0F172A', color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
            <button onClick={() => onRemove(o._id)} style={{
              fontSize: 12, padding: '7px 14px', border: '1px solid #FECDD3',
              borderRadius: 8, color: '#F43F5E', background: '#FFF1F2', cursor: 'pointer', fontWeight: 500,
            }}>Remove</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default OfficersTab;
