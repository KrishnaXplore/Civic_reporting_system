import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getDashboardRoute } from '../../utils/helpers';

const Navbar = ({ transparent = false }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: transparent ? 'transparent' : '#fff',
      borderBottom: transparent ? 'none' : '1px solid #F1F5F9',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: transparent ? 'absolute' : 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: transparent ? '#fff' : '#0F172A', textDecoration: 'none', letterSpacing: '-0.3px' }}>
        CivicConnect
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/map" style={{ fontSize: 13, color: transparent ? 'rgba(255,255,255,0.8)' : '#64748B', textDecoration: 'none', fontWeight: 500 }}>Map</Link>
        <Link to="/complaints" style={{ fontSize: 13, color: transparent ? 'rgba(255,255,255,0.8)' : '#64748B', textDecoration: 'none', fontWeight: 500 }}>Complaints</Link>
        <Link to="/departments" style={{ fontSize: 13, color: transparent ? 'rgba(255,255,255,0.8)' : '#64748B', textDecoration: 'none', fontWeight: 500 }}>Departments</Link>
        <Link to="/about" style={{ fontSize: 13, color: transparent ? 'rgba(255,255,255,0.8)' : '#64748B', textDecoration: 'none', fontWeight: 500 }}>About</Link>

        {user ? (
          <>
            <Link to={getDashboardRoute(user.role)} style={{
              fontSize: 13, color: transparent ? '#fff' : '#3B82F6', textDecoration: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Dashboard
              {unreadCount > 0 && (
                <span style={{ background: '#F43F5E', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <button onClick={handleLogout} style={{ fontSize: 13, color: '#F43F5E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              fontSize: 13, color: transparent ? '#fff' : '#475569', textDecoration: 'none', fontWeight: 500,
              padding: '7px 16px', border: `1px solid ${transparent ? 'rgba(255,255,255,0.4)' : '#E2E8F0'}`, borderRadius: 8,
            }}>
              Login
            </Link>
            <Link to="/register" style={{
              fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600,
              padding: '7px 16px', background: '#3B82F6', borderRadius: 8,
            }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
