import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center', padding: 32,
  }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap" rel="stylesheet" />
    <p style={{ fontSize: 80, margin: '0 0 16px', lineHeight: 1 }}>🗺️</p>
    <h1 style={{ fontSize: 72, fontWeight: 800, color: '#0F172A', letterSpacing: '-3px', margin: '0 0 8px' }}>404</h1>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Page not found</h2>
    <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 360, marginBottom: 32, lineHeight: 1.6 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link to="/" style={{
      padding: '12px 28px', background: '#3B82F6', color: '#fff',
      borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14,
    }}>
      Back to Home
    </Link>
  </div>
);

export default NotFoundPage;
