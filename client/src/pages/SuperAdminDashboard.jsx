import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Toast from '../components/common/Toast';
import OverviewTab from '../components/super-admin/OverviewTab';
import DepartmentsTab from '../components/super-admin/DepartmentsTab';
import FlaggedUsersTab from '../components/super-admin/FlaggedUsersTab';
import SupportTab from '../components/super-admin/SupportTab';
import LogsTab from '../components/super-admin/LogsTab';
import { getStatsApi, getFlaggedUsersApi, banUserApi, clearStrikesApi } from '../api/admin.api';
import { getDepartmentsApi } from '../api/departments.api';
import { useToast } from '../hooks/useToast';

const NAV = [
  { key: 'overview',    icon: '▦', label: 'Overview' },
  { key: 'departments', icon: '◫', label: 'Departments' },
  { key: 'flagged',     icon: '⚑', label: 'Flagged Users' },
  { key: 'support',     icon: '✉', label: 'Support' },
  { key: 'logs',        icon: '≡', label: 'Audit Logs' },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStatsApi(), getFlaggedUsersApi(), getDepartmentsApi()])
      .then(([sRes, fRes, dRes]) => {
        setStats(sRes.data.data);
        setFlagged(fRes.data.data);
        setDepartments(dRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBan = async (id) => {
    if (!window.confirm('Ban this user? They will lose access immediately.')) return;
    await banUserApi(id);
    setFlagged((prev) => prev.filter((u) => u._id !== id));
    showToast('User banned successfully');
  };

  const handleClear = async (id) => {
    await clearStrikesApi(id);
    setFlagged((prev) => prev.filter((u) => u._id !== id));
    showToast('Strikes cleared');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <Sidebar navItems={NAV} activeTab={tab} onTabChange={setTab} accentColor="#A855F7" roleLabel="Super Admin" />

      <main style={{ marginLeft: 240, flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {NAV.find((n) => n.key === tab)?.label}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>System-wide administration panel</p>
        </div>

        <Toast toast={toast} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Loading...</div>
        ) : (
          <>
            {tab === 'overview'    && <OverviewTab stats={stats} departments={departments} />}
            {tab === 'departments' && <DepartmentsTab departments={departments} stats={stats} />}
            {tab === 'flagged'     && <FlaggedUsersTab flagged={flagged} onBan={handleBan} onClear={handleClear} />}
            {tab === 'support'     && <SupportTab />}
            {tab === 'logs'        && <LogsTab />}
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
