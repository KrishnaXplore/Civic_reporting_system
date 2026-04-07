import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const ComplaintsTab = ({ complaints, loading }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const filtered = statusFilter ? complaints.filter((c) => c.status === statusFilter) : complaints;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'Submitted', 'Assigned', 'InProgress', 'Resolved', 'Rejected'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
            borderColor: statusFilter === s ? '#3B82F6' : '#E2E8F0',
            background: statusFilter === s ? '#3B82F6' : '#fff',
            color: statusFilter === s ? '#fff' : '#64748B',
          }}>
            {s || 'All'} ({s ? complaints.filter((c) => c.status === s).length : complaints.length})
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
                {['Complaint', 'Citizen', 'Officer', 'Status', 'Date', ''].map((h) => (
                  <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '13px 20px' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', margin: 0 }}>{c.title}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{c.category}</p>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{c.citizen?.name || '—'}</td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{c.assignedTo?.name || '—'}</td>
                  <td style={{ padding: '13px 20px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8' }}>{formatDate(c.createdAt)}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <Link to={`/complaint/${c._id}`} style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500, textDecoration: 'none' }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default ComplaintsTab;
