import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import Toast from '../components/common/Toast';
import OverviewTab from '../components/dept-admin/OverviewTab';
import ComplaintsTab from '../components/dept-admin/ComplaintsTab';
import OfficersTab from '../components/dept-admin/OfficersTab';
import { getDepartmentComplaintsApi } from '../api/complaints.api';
import { getDepartmentsApi, addOfficerApi, removeOfficerApi } from '../api/departments.api';
import { useToast } from '../hooks/useToast';

const NAV = [
  { key: 'overview',   icon: '▦', label: 'Overview' },
  { key: 'complaints', icon: '≡', label: 'Complaints' },
  { key: 'officers',   icon: '◎', label: 'Officers' },
];

const DeptAdminDashboard = () => {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const deptId = user?.department?._id || user?.department;
  const deptName = user?.department?.name || 'Your Department';

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        getDepartmentComplaintsApi(),
        getDepartmentsApi(),
      ]);
      setComplaints(cRes.data.data || []);
      const myDept = dRes.data.data?.find((d) => d._id === deptId);
      if (myDept) setOfficers(myDept.officers || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddOfficer = async (email) => {
    try {
      await addOfficerApi(deptId, email);
      showToast('Officer added successfully');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add officer', 'error');
    }
  };

  const handleRemoveOfficer = async (officerId) => {
    if (!window.confirm('Remove this officer from your department?')) return;
    await removeOfficerApi(deptId, officerId);
    setOfficers((prev) => prev.filter((o) => o._id !== officerId));
    showToast('Officer removed');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />

      <Sidebar navItems={NAV} activeTab={tab} onTabChange={setTab} accentColor="#3B82F6" roleLabel="Dept Admin" />

      <main style={{ marginLeft: 240, flex: 1, padding: '36px 40px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            {NAV.find((n) => n.key === tab)?.label}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{deptName}</p>
        </div>

        <Toast toast={toast} />

        {tab === 'overview'   && <OverviewTab complaints={complaints} officers={officers} onManageOfficers={() => setTab('officers')} />}
        {tab === 'complaints' && <ComplaintsTab complaints={complaints} loading={loading} />}
        {tab === 'officers'   && <OfficersTab officers={officers} deptId={deptId} onAdd={handleAddOfficer} onRemove={handleRemoveOfficer} />}
      </main>
    </div>
  );
};

export default DeptAdminDashboard;
