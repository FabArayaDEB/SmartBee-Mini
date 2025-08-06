import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import LoadingSpinner from './LoadingSpinner';
import { useSocket } from '../contexts/SocketContext';

function AlertsWidget({ limit = 5, showHeader = true }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { alerts: socketAlerts } = useSocket();

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);
  
  // Combinar alertas de la API con alertas en tiempo real del socket
  useEffect(() => {
    if (socketAlerts && socketAlerts.length > 0) {
      console.log('Socket alerts recibidas:', socketAlerts);
      // Usar directamente las alertas del socket para mostrarlas
      setAlerts(socketAlerts.slice(0, limit));
      console.log('Alertas actualizadas:', socketAlerts.slice(0, limit));
    }
  }, [socketAlerts, limit]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts', {
        params: {
          limit,
          sort: '-createdAt'
        }
      });
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/alerts/stats');
      setStats(response.data.data?.overview || null);
    } catch (error) {
      console.error('Error fetching alert stats:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'high':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeIcon = (type) => {
    // Convertir a string y a minúsculas para hacer la comparación más robusta
    const typeStr = String(type).toLowerCase();
    
    // Iconos para temperatura
    if (typeStr.includes('temp') || typeStr.includes('temperature')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    
    // Iconos para humedad
    if (typeStr.includes('hum') || typeStr.includes('humidity')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    }
    
    // Iconos para peso
    if (typeStr.includes('peso') || typeStr.includes('weight')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m-3 1l-3-1" />
        </svg>
      );
    }
    
    // Iconos para batería
    if (typeStr.includes('bat') || typeStr.includes('battery')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10.5h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H21m0-3V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-1.5m0-3h-1" />
        </svg>
      );
    }
    
    // Iconos para desconexión
    if (typeStr.includes('off') || typeStr.includes('offline') || typeStr.includes('desconect')) {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v2m0 16v2m10-10h-2M4 12H2" />
        </svg>
      );
    }
    
    // Icono por defecto para otros tipos de alertas
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner size="md" text="Cargando alertas..." />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {showHeader && (
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
            <Link to="/alerts" className="btn-outline btn-sm">
              Ver todas
            </Link>
          </div>
          
          {stats && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">{stats.unread}</div>
                <div className="text-sm text-gray-500">Sin leer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger-600">{stats.unresolved}</div>
                <div className="text-sm text-gray-500">Sin resolver</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger-600">{stats.bySeverity?.critical || 0}</div>
                <div className="text-sm text-gray-500">Críticas</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="card-body">
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={alert.id || alert._id || index}
                className="p-4 rounded-lg border bg-white border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      {getTypeIcon(alert.indicador || alert.type || '')}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.alerta_nombre || alert.title || alert.type || 'Alerta'}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {moment(alert.fecha || alert.timestamp).fromNow()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-700">
                      {alert.alerta_descripcion || alert.message || 'Sin descripción'}
                    </p>
                    
                    {(alert.nodo_descripcion || alert.nodeId) && (
                      <p className="mt-1 text-xs text-gray-500">
                        Nodo: {alert.nodo_descripcion || alert.nodeId}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (alert.indicador?.includes('CRIT') || alert.severity === 'critical') ? 'bg-danger-100 text-danger-800' :
                        (alert.indicador?.includes('HIGH') || alert.severity === 'high' || alert.type?.includes('TEMP')) ? 'bg-warning-100 text-warning-800' :
                        (alert.indicador?.includes('MED') || alert.severity === 'medium' || alert.type?.includes('HUM')) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {(alert.indicador?.includes('CRIT') || alert.severity === 'critical') ? 'Crítica' :
                         (alert.indicador?.includes('HIGH') || alert.severity === 'high' || alert.type?.includes('TEMP')) ? 'Alta' :
                         (alert.indicador?.includes('MED') || alert.severity === 'medium' || alert.type?.includes('HUM')) ? 'Media' :
                         'Normal'}
                      </span>
                      
                      {alert.value && (
                        <span className="text-xs text-gray-600">
                          Valor: {alert.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todas las colmenas están funcionando correctamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsWidget;