import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ApicultorDashboard from '../pages/ApicultorDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import LoadingSpinner from './LoadingSpinner';

function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error de autenticación</h2>
          <p className="mt-2 text-gray-600">No se pudo cargar la información del usuario.</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'apicultor':
      return <ApicultorDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Rol no reconocido</h2>
            <p className="mt-2 text-gray-600">
              Tu rol de usuario ({user.role}) no está configurado correctamente.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Contacta al administrador para resolver este problema.
            </p>
          </div>
        </div>
      );
  }
}

export default DashboardRouter;