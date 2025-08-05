import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import SensorWidget from '../components/SensorWidget';
import ChartWidget from '../components/ChartWidget';
import AlertsWidget from '../components/AlertsWidget';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

moment.locale('es');

function ApicultorDashboard() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const { latestData, getNodeLatestData } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const response = await axios.get('/api/nodes');
      setNodes(response.data.nodes);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeStatus = (node) => {
    const realtimeData = getNodeLatestData(node.nodeId);
    const lastData = realtimeData || node.latestData;
    
    if (!lastData) return 'offline';
    
    const now = new Date();
    const lastSeen = new Date(lastData.timestamp);
    const minutesDiff = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (minutesDiff < 10) return 'online';
    if (minutesDiff < 60) return 'warning';
    return 'offline';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-success-600 bg-success-100';
      case 'warning': return 'text-warning-600 bg-warning-100';
      case 'offline': return 'text-danger-600 bg-danger-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'warning': return 'Advertencia';
      case 'offline': return 'Desconectado';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Cargando dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard - {user?.firstName} {user?.lastName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitoreo en tiempo real de tus colmenas
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-input"
            >
              <option value="day">Último día</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Total Colmenas</h3>
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{nodes.filter(n => n.type === 'colmena').length}</div>
              <div className="widget-label">Nodos de colmena activos</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Nodos Ambientales</h3>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{nodes.filter(n => n.type === 'ambiental').length}</div>
              <div className="widget-label">Sensores ambientales</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Nodos Online</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">
                {nodes.filter(node => getNodeStatus(node) === 'online').length}
              </div>
              <div className="widget-label">Conectados ahora</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Alertas Activas</h3>
              <div className="p-2 bg-warning-100 rounded-lg">
                <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">0</div>
              <div className="widget-label">Requieren atención</div>
            </div>
          </div>
        </div>

        {/* Real-time Data Widgets */}
        {nodes.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Datos en Tiempo Real</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {nodes.map((node) => {
                const realtimeData = getNodeLatestData(node.nodeId);
                const data = realtimeData || node.latestData;
                const status = getNodeStatus(node);
                
                return (
                  <div key={node.nodeId || node._id} className="card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{node.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{node.type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      {data ? (
                        <div className="space-y-4">
                          <SensorWidget
                            label="Temperatura"
                            value={data.data?.temperature || data.temperature}
                            unit="°C"
                            icon="temperature"
                            color="text-danger-600"
                          />
                          <SensorWidget
                            label="Humedad"
                            value={data.data?.humidity || data.humidity}
                            unit="%"
                            icon="humidity"
                            color="text-secondary-600"
                          />
                          {node.type === 'colmena' && data.data?.weight && (
                            <SensorWidget
                              label="Peso"
                              value={data.data.weight}
                              unit="kg"
                              icon="weight"
                              color="text-primary-600"
                            />
                          )}
                          <div className="text-xs text-gray-500">
                            Última actualización: {moment(data.timestamp).fromNow()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">Sin datos disponibles</p>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <Link
                        to={`/node/${node.nodeId}`}
                        className="btn-primary btn-sm w-full"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay nodos asignados</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contacta al administrador para que te asigne nodos de monitoreo.
            </p>
          </div>
        )}

        {/* Recent Alerts */}
        <AlertsWidget />
      </div>
    </Layout>
  );
}

export default ApicultorDashboard;