import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AlertsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = '/api/alerts';
      
      if (filter !== 'all') {
        url += `?alerta_id=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setError('Error al cargar alertas');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (indicador) => {
    switch (indicador?.toLowerCase()) {
      case 'critico':
        return 'bg-red-100 text-red-800';
      case 'alto':
        return 'bg-orange-100 text-orange-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'bajo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
        <p className="text-gray-600">Monitorea las alertas generadas por los nodos</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('1')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === '1'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Temperatura Alta
          </button>
          <button
            onClick={() => setFilter('2')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === '2'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Humedad Baja
          </button>
          <button
            onClick={() => setFilter('3')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === '3'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Batería Baja
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Lista de Alertas</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Alerta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <tr key={`${alert.nodo_id}-${alert.alerta_id}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(alert.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {alert.nodo?.descripcion || `Nodo ${alert.nodo_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {alert.nodo?.tipo || 'Tipo desconocido'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {alert.alerta?.nombre || 'Alerta desconocida'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {alert.alerta?.descripcion || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getSeverityColor(alert.alerta?.indicador)
                      }`}>
                        {alert.alerta?.indicador || 'Sin definir'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alert.nodo?.ubicacion ? (
                        <div>
                          <div>{alert.nodo.ubicacion.descripcion}</div>
                          <div className="text-xs text-gray-500">
                            {alert.nodo.ubicacion.latitud}, {alert.nodo.ubicacion.longitud}
                          </div>
                        </div>
                      ) : (
                        'Sin ubicación'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay alertas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;