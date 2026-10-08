import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import AdminSidebar from './components/layout/AdminSidebar';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Pages
import StudentHome from './pages/student/StudentHome';
import StudentMenu from './pages/student/StudentMenu';
import StudentCart from './pages/student/StudentCart';
import StudentOrders from './pages/student/StudentOrders';
import StudentOrderDetail from './pages/student/StudentOrderDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInventory from './pages/admin/AdminInventory';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminPredictions from './pages/admin/AdminPredictions';
import AdminAIAssistant from './pages/admin/AdminAIAssistant';
import AdminWasteAudit from './pages/admin/AdminWasteAudit';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';

const StudentLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
    <Navbar />
    <main className="flex-1 pb-16">{children}</main>
  </div>
);

const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
    <AdminSidebar />
    <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
  </div>
);

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentHome />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/menu"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentMenu />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/cart"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentCart />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/orders"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentOrders />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/orders/:id"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentOrderDetail />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminMenu />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminInventory />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/predictions"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminPredictions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ai-assistant"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminAIAssistant />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/waste"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminWasteAudit />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRole={['admin', 'student']}>
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
