import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth';

// Layouts
import Layout from '../components/layout/Layout';
import AdminLayout from '../components/layout/AdminLayout';

// Pages (lazy loaded for code splitting)
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const WizardPage = lazy(() => import('../pages/wizard/WizardPage'));
const EditorPage = lazy(() => import('../pages/EditorPage'));
const GiftViewPage = lazy(() => import('../pages/GiftViewPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="gift/:slug" element={<GiftViewPage />} />
          </Route>

          {/* Protected — authenticated users */}
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="wizard" element={<ProtectedRoute><WizardPage /></ProtectedRoute>} />
            <Route path="editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
            <Route path="checkout/:id" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
