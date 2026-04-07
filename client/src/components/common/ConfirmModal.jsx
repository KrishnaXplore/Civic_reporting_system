const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }}>
    <div style={{
      background: '#fff', borderRadius: 16, padding: '28px 32px',
      maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Are you sure?</p>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 10,
          fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer', fontWeight: 500,
        }}>
          Cancel
        </button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '10px', border: 'none', borderRadius: 10,
          fontSize: 13, color: '#fff', background: '#F43F5E', cursor: 'pointer', fontWeight: 600,
        }}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
