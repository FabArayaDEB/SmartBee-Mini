import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ApicultorDashboard from './pages/ApicultorDashboard';
import UserManagement from './pages/UserManagement';
import NodeManagement from './pages/NodeManagement';
import NodeDetails from './pages/NodeDetails';
import AlertsPage from './pages/AlertsPage';
import Profile from './pages/Profile';

// Styles
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/alerts" element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/node/:nodeId" element={
                <ProtectedRoute>
                  <NodeDetails />
                </ProtectedRoute>
              } />
              
              {/* Admin Only Routes */}
              <Route path="/admin/users" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />
              
              <Route path="/admin/nodes" element={
                <AdminRoute>
                  <NodeManagement />
                </AdminRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

// Component to route to appropriate dashboard based on user role
function DashboardRouter() {
  const { user } = React.useContext(require('./contexts/AuthContext').AuthContext);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return user.role === 'admin' ? <AdminDashboard /> : <ApicultorDashboard />;
}

export default App;