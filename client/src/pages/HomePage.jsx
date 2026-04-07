import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { getStatsApi } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/helpers';

const FEATURES = [
  { icon: '📍', title: 'Report Issues', desc: 'Submit civic complaints with photos and GPS location in seconds.' },
  { icon: '🤖', title: 'AI Verification', desc: 'AI detects fake images and duplicate complaints automatically.' },
  { icon: '🔔', title: 'Live Updates', desc: 'Get real-time notifications as your complaint moves through resolution.' },
  { icon: '🗺️', title: 'Live Map', desc: 'See all active complaints in your city plotted on an interactive map.' },
  { icon: '📊', title: 'Transparency', desc: 'Public dashboard shows resolution rates, funds spent, and department stats.' },
  { icon: '🛡️', title: 'Trust System', desc: 'Citizen trust scores reward honest reporting and discourage abuse.' },
];

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    getStatsApi()
      .then(({ data }) => setStats(data.data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
      }}>
        <Navbar transparent />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 32px 100px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 20, padding: '5px 16px', marginBottom: 24, fontSize: 12, fontWeight: 600, color: '#93C5FD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Civic Tech for India
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24 }}>
            Report. Track. Resolve.
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            CivicConnect bridges citizens and government. Report local issues, track resolution in real time, and hold departments accountable.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to={getDashboardRoute(user.role)} style={{
                padding: '14px 32px', background: '#3B82F6', color: '#fff', borderRadius: 12,
                textDecoration: 'none', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px',
              }}>
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" style={{
                padding: '14px 32px', background: '#3B82F6', color: '#fff', borderRadius: 12,
                textDecoration: 'none', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px',
              }}>
                Get Started Free
              </Link>
            )}
            <Link to="/map" style={{
              padding: '14px 32px', background: 'rgba(255,255,255,0.1)', color: '#E2E8F0',
              borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              View Live Map
            </Link>
          </div>

          {/* Live stats */}
          {stats && (
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
              {[
                { label: 'Complaints Filed', value: stats.totalComplaints?.toLocaleString() },
                { label: 'Resolved', value: stats.resolved?.toLocaleString() },
                { label: 'Citizens', value: stats.totalCitizens?.toLocaleString() },
                { label: 'Funds Tracked', value: `₹${(stats.totalFunds || 0).toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-1px', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', marginBottom: 12 }}>
            Everything you need
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>
            A full-stack civic platform built for transparency, accountability, and real impact.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: '#fff', borderRadius: 16, padding: '28px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
              transition: 'box-shadow 0.2s',
            }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0F172A', padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.8px', marginBottom: 12 }}>
          Your city needs your voice
        </h2>
        <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
          Join thousands of citizens making their city better — one complaint at a time.
        </p>
        {user ? (
          <Link to="/complaint/new" style={{
            padding: '14px 36px', background: '#3B82F6', color: '#fff', borderRadius: 12,
            textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>
            Submit a Complaint
          </Link>
        ) : (
          <Link to="/register" style={{
            padding: '14px 36px', background: '#3B82F6', color: '#fff', borderRadius: 12,
            textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>
            Register Now
          </Link>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>© 2025 CivicConnect. Built for transparent governance.</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/about" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>About</Link>
          <Link to="/support" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Support</Link>
          <Link to="/map" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>Live Map</Link>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
