import { useState } from 'react';
import { resolveComplaintApi } from '../../api/complaints.api';

const ResolveModal = ({ complaintId, onClose, onResolved }) => {
  const [afterImage, setAfterImage] = useState(null);
  const [fundsSpent, setFundsSpent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!afterImage) return setError('Please upload an after image');
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('afterImage', afterImage);
      fd.append('fundsSpent', fundsSpent);
      await resolveComplaintApi(complaintId, fd);
      onResolved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Resolve Complaint</h3>

        {error && (
          <div style={{ padding: '10px 14px', background: '#FFF1F2', color: '#BE123C', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECDD3' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            After Image <span style={{ color: '#F43F5E' }}>*</span>
          </label>
          <label style={{
            display: 'block', border: '2px dashed #E2E8F0', borderRadius: 10,
            padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: afterImage ? '#F0FDF4' : '#F8FAFC',
          }}>
            <input type="file" accept="image/*" onChange={(e) => setAfterImage(e.target.files[0])} style={{ display: 'none' }} />
            {afterImage ? (
              <p style={{ fontSize: 13, color: '#15803D', fontWeight: 500, margin: 0 }}>✓ {afterImage.name}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Click to upload after photo</p>
            )}
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Funds Spent (₹)</label>
          <input
            type="number"
            value={fundsSpent}
            onChange={(e) => setFundsSpent(e.target.value)}
            placeholder="0"
            min="0"
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10,
            fontSize: 13, color: '#475569', background: '#fff', cursor: 'pointer', fontWeight: 500,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '11px', border: 'none', borderRadius: 10,
            fontSize: 13, color: '#fff', background: loading ? '#94A3B8' : '#22C55E',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
          }}>
            {loading ? 'Resolving...' : 'Confirm Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveModal;
