import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ComplaintForm from './pages/ComplaintForm';
import ComplaintDetail from './pages/ComplaintDetail';
import OfficerDashboard from './pages/OfficerDashboard';
import DeptAdminDashboard from './pages/DeptAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { ProfilePage, UnauthorizedPage } from './pages/ProfilePage';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Citizen */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/complaint/new" element={
              <ProtectedRoute roles={['citizen']}>
                <ComplaintForm />
              </ProtectedRoute>
            } />
            <Route path="/complaint/:id" element={
              <ProtectedRoute roles={['citizen', 'officer', 'deptAdmin', 'superAdmin']}>
                <ComplaintDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['citizen', 'officer', 'deptAdmin', 'superAdmin']}>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Officer */}
            <Route path="/staff/dashboard" element={
              <ProtectedRoute roles={['officer']}>
                <OfficerDashboard />
              </ProtectedRoute>
            } />

            {/* Dept Admin */}
            <Route path="/dept-admin/dashboard" element={
              <ProtectedRoute roles={['deptAdmin']}>
                <DeptAdminDashboard />
              </ProtectedRoute>
            } />

            {/* Super Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['superAdmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
