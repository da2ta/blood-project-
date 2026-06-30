import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/ui/Toast';
import { FullPageSpinner } from './components/ui/Spinner';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';

// Route guards
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { RoleGuard } from './routes/RoleGuard';
import { ApprovedHospitalGuard } from './routes/ApprovedHospitalGuard';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { HospitalApprovalPage } from './pages/admin/HospitalApprovalPage';
import { StaffManagementPage } from './pages/dashboard/StaffManagementPage';
import { HospitalProfilePage } from './pages/dashboard/HospitalProfilePage';
import { AuditLogsPage } from './pages/dashboard/AuditLogsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Auth pages (redirect if already logged in) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
        </Route>

        {/* Pending approval (authenticated but not approved) */}
        <Route
          path="/pending-approval"
          element={
            <ProtectedRoute>
              <PendingApprovalPage />
            </ProtectedRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <ApprovedHospitalGuard>
                <AppLayout />
              </ApprovedHospitalGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/staff" element={<RoleGuard allowedRoles={['HOSPITAL_ADMIN']}><StaffManagementPage /></RoleGuard>} />
          <Route path="/profile" element={<RoleGuard allowedRoles={['HOSPITAL_ADMIN']}><HospitalProfilePage /></RoleGuard>} />
          <Route path="/audit-logs" element={<RoleGuard allowedRoles={['HOSPITAL_ADMIN']}><AuditLogsPage /></RoleGuard>} />

          {/* Super Admin routes */}
          <Route
            path="/admin/hospitals"
            element={
              <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                <HospitalApprovalPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
