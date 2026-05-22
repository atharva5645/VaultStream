import React, { Suspense, lazy, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ToastProvider from './components/feedback/ToastProvider';
import OfflineBanner from './components/feedback/OfflineBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import SuspenseFallback from './components/system/SuspenseFallback';
import CommandPalette from './components/system/CommandPalette';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MaintenanceMode = lazy(() => import('./pages/MaintenanceMode'));
const ViewerLayout = lazy(() => import('./layouts/ViewerLayout'));
const EditorLayout = lazy(() => import('./layouts/EditorLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const ViewerDashboard = lazy(() => import('./pages/viewer/ViewerDashboard'));
const MyVideos = lazy(() => import('./pages/viewer/MyVideos'));
const WatchVideo = lazy(() => import('./pages/viewer/WatchVideo'));
const EditorDashboard = lazy(() => import('./pages/editor/EditorDashboard'));
const TenantDashboard = lazy(() => import('./pages/editor/TenantDashboard'));
const TeamMembers = lazy(() => import('./pages/editor/TeamMembers'));
const WorkspaceSettings = lazy(() => import('./pages/editor/WorkspaceSettings'));
const InviteMembers = lazy(() => import('./pages/editor/InviteMembers'));
const UploadVideo = lazy(() => import('./pages/editor/UploadVideo'));
const Library = lazy(() => import('./pages/editor/Library'));
const VideoAnalytics = lazy(() => import('./pages/editor/VideoAnalytics'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageTenants = lazy(() => import('./pages/admin/ManageTenants'));
const Moderation = lazy(() => import('./pages/admin/Moderation'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const ProcessingDashboard = lazy(() => import('./pages/admin/ProcessingDashboard'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const AdminSystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

const AnimatedRoutes = ({ isAuthenticated, role, getDashboardPath }) => {
  const location = useLocation();

  return (
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={getDashboardPath()} replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={getDashboardPath()} replace />} />
        <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to={getDashboardPath()} replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={getDashboardPath()} replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allowedRoles={['viewer', 'admin']} />}>
            <Route path="/viewer" element={<ViewerLayout />}>
              <Route path="dashboard" element={<ViewerDashboard />} />
              <Route path="videos" element={<MyVideos />} />
              <Route path="watch" element={<WatchVideo />} />
              <Route path="watch/:id" element={<WatchVideo />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRoles={['editor', 'admin']} />}>
            <Route path="/editor" element={<EditorLayout />}>
              <Route path="dashboard" element={<EditorDashboard />} />
              {/* <Route path="tenant" element={<TenantDashboard />} /> */}
              {/* <Route path="team" element={<TeamMembers />} /> */}
              {/* <Route path="invites" element={<InviteMembers />} /> */}
              {/* <Route path="workspace-settings" element={<WorkspaceSettings />} /> */}
              <Route path="upload" element={<UploadVideo />} />
              <Route path="library" element={<Library />} />
              {/* <Route path="analytics" element={<VideoAnalytics />} /> */}
              <Route path="settings" element={<SystemSettings />} />
            </Route>
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              {/* <Route path="tenants" element={<ManageTenants />} /> */}
              <Route path="moderation" element={<Moderation />} />
              {/* <Route path="analytics" element={<AnalyticsDashboard />} /> */}
              {/* <Route path="processing" element={<ProcessingDashboard />} /> */}
              {/* <Route path="settings" element={<AdminSystemSettings />} /> */}
            </Route>
          </Route>
        </Route>

        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
};

function App() {
  const { role, isAuthenticated, loading, logout } = useAuth();
  const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true' || import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { toggleTheme } = useTheme();

  const shortcuts = useMemo(() => [
    { combo: 'ctrl+k', handler: () => setPaletteOpen((prev) => !prev) },
    { combo: 'ctrl+j', handler: () => toggleTheme() },
  ], [toggleTheme]);
  useKeyboardShortcuts(shortcuts);

  if (loading) return <SuspenseFallback />;
  if (maintenanceMode) return <MaintenanceMode />;

  const getDashboardPath = () => {
    if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
      logout();
      return '/login';
    }
    return `/${role}/dashboard`;
  };

  return (
    <SocketProvider>
      <BrowserRouter>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[101] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black">Skip to content</a>
        <OfflineBanner />
        <ToastProvider />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={role} />
        <main id="main-content">
          <Suspense fallback={<SuspenseFallback />}>
            <AnimatedRoutes isAuthenticated={isAuthenticated} role={role} getDashboardPath={getDashboardPath} />
          </Suspense>
        </main>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
