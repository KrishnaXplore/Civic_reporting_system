import { STATUS_COLORS } from '../../utils/constants';

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.Submitted;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 20,
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status === 'InProgress' ? 'In Progress' : status}
    </span>
  );
};

export default StatusBadge;
