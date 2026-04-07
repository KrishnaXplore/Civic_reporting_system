import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../api/auth.api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link to="/login" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontWeight: 500 }}>
          ← Back to Login
        </Link>

        {done ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📧</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Check your email</h2>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              If <strong>{email}</strong> is registered, you'll receive a password reset link in the next few minutes.
            </p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: 24, fontSize: 13, color: '#3B82F6', fontWeight: 600 }}>
              Return to login
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.4px' }}>Forgot password?</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 28 }}>Enter your email and we'll send a reset link.</p>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FFF1F2', color: '#BE123C', fontSize: 13, marginBottom: 18, border: '1px solid #FECDD3' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
              />
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', background: loading ? '#94A3B8' : '#0F172A',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans',
              }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
