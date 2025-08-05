import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(formData);
    
    setIsLoading(false);
    
    if (result.success) {
      // Navigation will be handled by the Navigate component above
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-primary-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            SmartBee Mini
          </h2>
          <p className="text-gray-600">
            Sistema de Monitoreo de Colmenas
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="form-label">
                  Nombre
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ingresa tu nombre"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary btn-lg flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="card bg-gray-50">
          <div className="card-body">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Credenciales de Demostración
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Administrador:</span>
                <br />
                <span className="text-gray-600">Nombre: Administrador | Contraseña: admin123</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Apicultor:</span>
                <br />
                <span className="text-gray-600">Nombre: Juan | Contraseña: apicultor123</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Apicultor 2:</span>
                <br />
                <span className="text-gray-600">Nombre: María | Contraseña: apicultor123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            © 2024 SmartBee Mini. Sistema de monitoreo de colmenas IoT.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;