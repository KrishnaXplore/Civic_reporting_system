import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordApi } from '../api/auth.api';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const userId = params.get('id');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    if (!token || !userId) return setError('Invalid reset link');

    setLoading(true);
    try {
      await resetPasswordApi(token, userId, password);
      navigate('/login?reset=1');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !userId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#BE123C', fontWeight: 600 }}>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: '#3B82F6', fontSize: 13 }}>Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.4px' }}>Set new password</h1>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>Enter and confirm your new password below.</p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF1F2', color: '#BE123C', fontSize: 13, marginBottom: 18, border: '1px solid #FECDD3' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>New Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: loading ? '#94A3B8' : '#0F172A',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans',
          }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
