import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Sidebar = ({ navItems, activeTab, onTabChange, accentColor = '#3B82F6', roleLabel = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <>
      <div style={{ padding: '28px 24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px', textDecoration: 'none' }}>
            CivicConnect
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="sidebar-close-btn"
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 18, padding: 4 }}
          >
            ✕
          </button>
        </div>
        {roleLabel && (
          <div style={{
            marginTop: 6, display: 'inline-block', fontSize: 10, fontWeight: 600,
            color: accentColor, background: `${accentColor}22`, padding: '2px 8px',
            borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {roleLabel}
          </div>
        )}
      </div>

      <nav style={{ padding: '0 12px', flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => { onTabChange(item.key); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              marginBottom: 2, fontSize: 13, fontWeight: 500, textAlign: 'left',
              background: activeTab === item.key ? `${accentColor}22` : 'transparent',
              color: activeTab === item.key ? accentColor : '#64748B',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '20px 24px', borderTop: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt="avatar"
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: `${accentColor}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: accentColor,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>{user?.department?.name || roleLabel}</p>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); navigate('/login'); }}
          style={{ fontSize: 12, color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Sign out →
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="sidebar-hamburger"
        style={{
          position: 'fixed', top: 14, left: 14, zIndex: 200,
          background: '#0F172A', border: 'none', borderRadius: 10, padding: '8px 10px',
          cursor: 'pointer', color: '#F8FAFC', fontSize: 18, lineHeight: 1,
          display: 'none', // shown via CSS media query below
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Overlay — mobile only */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="sidebar-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none', // shown via CSS
          }}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`sidebar-panel${open ? ' sidebar-open' : ''}`}
        style={{
          width: 240, background: '#0F172A', position: 'fixed',
          top: 0, left: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 100,
        }}
      >
        {sidebarContent}
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-hamburger { display: block !important; }
          .sidebar-overlay { display: block !important; }
          .sidebar-panel {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .sidebar-panel.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .sidebar-hamburger { display: none !important; }
          .sidebar-overlay { display: none !important; }
          .sidebar-panel { transform: none !important; }
          .sidebar-close-btn { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
