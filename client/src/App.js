// Importaciones principales de React y librerías de enrutamiento
import React from 'react'; // Librería principal de React
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Enrutamiento SPA
import { ToastContainer } from 'react-toastify'; // Notificaciones toast
import 'react-toastify/dist/ReactToastify.css'; // Estilos para notificaciones

// Proveedores de contexto para estado global
import { AuthProvider } from './contexts/AuthContext'; // Contexto de autenticación
import { SocketProvider } from './contexts/SocketContext'; // Contexto de WebSocket para tiempo real

// Componentes de protección de rutas
import ProtectedRoute from './components/ProtectedRoute'; // Rutas que requieren autenticación
import AdminRoute from './components/AdminRoute'; // Rutas exclusivas para administradores

// Páginas de la aplicación
import Login from './pages/Login'; // Página de inicio de sesión
import AdminDashboard from './pages/AdminDashboard'; // Dashboard para administradores
import ApicultorDashboard from './pages/ApicultorDashboard'; // Dashboard para apicultores
import UserManagement from './pages/UserManagement'; // Gestión de usuarios (admin)
import NodeManagement from './pages/NodeManagement'; // Gestión de nodos IoT
import NodeDetails from './pages/NodeDetails'; // Detalles específicos de un nodo
import AlertsPage from './pages/AlertsPage'; // Página de alertas del sistema
import Profile from './pages/Profile'; // Perfil de usuario

// Estilos globales de la aplicación
import './index.css';

// Componente principal de la aplicación SmartBee Mini
function App() {
  return (
    // Proveedor de contexto de autenticación (envuelve toda la app)
    <AuthProvider>
      {/* Proveedor de contexto de WebSocket para comunicación en tiempo real */}
      <SocketProvider>
        {/* Router principal para navegación SPA */}
        <Router future={{ v7_relativeSplatPath: true }}>
          <div className="App min-h-screen bg-gray-50">
            <Routes>
              {/* Rutas públicas - no requieren autenticación */}
              <Route path="/login" element={<Login />} />
              
              {/* Rutas protegidas - requieren autenticación */}
              {/* Redirección de raíz a dashboard */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
              
              {/* Dashboard principal - redirige según rol de usuario */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } />
              
              {/* Página de perfil de usuario */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Página de alertas del sistema */}
              <Route path="/alerts" element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              } />
              
              {/* Detalles específicos de un nodo IoT */}
              <Route path="/node/:nodeId" element={
                <ProtectedRoute>
                  <NodeDetails />
                </ProtectedRoute>
              } />
              
              {/* Rutas exclusivas para administradores */}
              {/* Gestión de usuarios del sistema */}
              <Route path="/admin/users" element={
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              } />
              
              {/* Gestión de nodos IoT */}
              <Route path="/admin/nodes" element={
                <AdminRoute>
                  <NodeManagement />
                </AdminRoute>
              } />
              
              {/* Ruta catch-all - redirige rutas no encontradas al dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Contenedor de notificaciones toast */}
            <ToastContainer
              position="top-right"      // Posición en pantalla
              autoClose={5000}          // Auto-cerrar después de 5 segundos
              hideProgressBar={false}   // Mostrar barra de progreso
              newestOnTop={false}       // Nuevas notificaciones abajo
              closeOnClick              // Cerrar al hacer clic
              rtl={false}               // Dirección de texto izquierda a derecha
              pauseOnFocusLoss          // Pausar cuando se pierde el foco
              draggable                 // Permitir arrastrar
              pauseOnHover              // Pausar al pasar el mouse
              theme="light"             // Tema claro
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

// Componente para enrutar al dashboard apropiado según el rol del usuario
function DashboardRouter() {
  // Obtener información del usuario autenticado desde el contexto
  const { user } = React.useContext(require('./contexts/AuthContext').AuthContext);
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirigir al dashboard apropiado según el rol del usuario
  // Admin: Dashboard administrativo con gestión completa del sistema
  // Apicultor: Dashboard específico para monitoreo de colmenas
  return user.role === 'admin' ? <AdminDashboard /> : <ApicultorDashboard />;
}

export default App;