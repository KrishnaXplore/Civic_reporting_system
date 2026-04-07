import { useState, useEffect } from 'react';
import { getAllTicketsApi } from '../../api/support.api';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';

const ACTION_COLORS = {
  USER_BANNED:     { bg: '#FFF1F2', color: '#BE123C' },
  STRIKES_CLEARED: { bg: '#FFFBEB', color: '#B45309' },
  COMPLAINT_STATUS_CHANGED: { bg: '#EFF6FF', color: '#1D4ED8' },
};

const LogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      const { data } = await api.get('/api/v1/admin/audit-logs', { params });
      setLogs(data.data || []);
      setPages(data.pages || 1);
      setPage(p);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(1); }, [actionFilter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'USER_BANNED', 'STRIKES_CLEARED'].map((a) => (
          <button key={a} onClick={() => setActionFilter(a)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', border: '1px solid',
            borderColor: actionFilter === a ? '#0F172A' : '#E2E8F0',
            background: actionFilter === a ? '#0F172A' : '#fff',
            color: actionFilter === a ? '#fff' : '#64748B',
          }}>
            {a || 'All Actions'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#94A3B8', fontSize: 13 }}>No audit logs found.</div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['Action', 'Performed By', 'Target', 'Details', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const style = ACTION_COLORS[log.action] || { bg: '#F8FAFC', color: '#475569' };
                  return (
                    <tr key={log._id}
                      style={{ borderBottom: i < logs.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: style.bg, color: style.color }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{log.performedBy?.name || '—'}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{log.targetUser?.name || '—'}</td>
                      <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8', maxWidth: 240 }}>{log.details || '—'}</td>
                      <td style={{ padding: '13px 20px', fontSize: 12, color: '#94A3B8' }}>{formatDate(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => load(page - 1)} disabled={page === 1} style={{ padding: '7px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: '#fff', color: '#475569' }}>← Prev</button>
              <span style={{ padding: '7px 14px', fontSize: 12, color: '#64748B' }}>Page {page} of {pages}</span>
              <button onClick={() => load(page + 1)} disabled={page === pages} style={{ padding: '7px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: '#fff', color: '#475569' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LogsTab;
