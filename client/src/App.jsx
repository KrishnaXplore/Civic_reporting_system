import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import ComplaintForm from './pages/ComplaintForm';
import ComplaintDetail from './pages/ComplaintDetail';
import OfficerDashboard from './pages/OfficerDashboard';
import DeptAdminDashboard from './pages/DeptAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CityAdminDashboard from './pages/CityAdminDashboard';
import StateAdminDashboard from './pages/StateAdminDashboard';
import WardOfficerDashboard from './pages/WardOfficerDashboard';
import MapPage from './pages/MapPage';
import ComplaintsPage from './pages/ComplaintsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import AboutPage from './pages/AboutPage';
import SupportPage from './pages/SupportPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
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
            <Route path="/map" element={<MapPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <ProtectedRoute roles={['citizen', 'officer', 'wardOfficer', 'deptAdmin', 'cityAdmin', 'stateAdmin', 'superAdmin']}>
                <ComplaintDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute roles={['citizen', 'officer', 'wardOfficer', 'deptAdmin', 'cityAdmin', 'stateAdmin', 'superAdmin']}>
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

            {/* Ward Officer */}
            <Route path="/ward-officer/dashboard" element={
              <ProtectedRoute roles={['wardOfficer']}>
                <WardOfficerDashboard />
              </ProtectedRoute>
            } />

            {/* City Admin */}
            <Route path="/city-admin/dashboard" element={
              <ProtectedRoute roles={['cityAdmin']}>
                <CityAdminDashboard />
              </ProtectedRoute>
            } />

            {/* State Admin */}
            <Route path="/state-admin/dashboard" element={
              <ProtectedRoute roles={['stateAdmin']}>
                <StateAdminDashboard />
              </ProtectedRoute>
            } />

            {/* Super Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['superAdmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
