import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import SensorWidget from '../components/SensorWidget';
import AlertsWidget from '../components/AlertsWidget';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

moment.locale('es');

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    nodes: 0,
    onlineNodes: 0,
    alerts: 0
  });
  const [recentNodes, setRecentNodes] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { latestData, isConnected, getNodeLatestData } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, nodesRes, alertsRes] = await Promise.all([
        axios.get('/api/users?limit=5'),
        axios.get('/api/nodes?limit=10'),
        axios.get('/api/alerts/stats')
      ]);

      setStats({
        users: usersRes.data.total,
        nodes: nodesRes.data.total,
        onlineNodes: nodesRes.data.nodes.filter(node => {
          const realtimeData = getNodeLatestData(node.nodeId);
          const lastData = realtimeData || node.latestData;
          if (!lastData) return false;
          const now = new Date();
          const lastSeen = new Date(lastData.timestamp);
          const minutesDiff = Math.floor((now - lastSeen) / (1000 * 60));
          return minutesDiff < 10;
        }).length,
        alerts: alertsRes.data.unread
      });

      setRecentNodes(nodesRes.data.nodes);
      setRecentUsers(usersRes.data.users);

      // Calculate system health
      const totalNodes = nodesRes.data.total;
      const onlineNodes = nodesRes.data.nodes.filter(node => {
        const realtimeData = getNodeLatestData(node.nodeId);
        const lastData = realtimeData || node.latestData;
        if (!lastData) return false;
        const now = new Date();
        const lastSeen = new Date(lastData.timestamp);
        const minutesDiff = Math.floor((now - lastSeen) / (1000 * 60));
        return minutesDiff < 10;
      }).length;

      const healthPercentage = totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 100;
      setSystemHealth({
        percentage: healthPercentage,
        status: healthPercentage >= 80 ? 'excellent' : 
                healthPercentage >= 60 ? 'good' : 
                healthPercentage >= 40 ? 'warning' : 'critical'
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-success-600 bg-success-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-warning-600 bg-warning-100';
      case 'critical': return 'text-danger-600 bg-danger-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Cargando dashboard administrativo..." />
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
              Panel de Administración
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gestión y monitoreo del sistema SmartBee Mini
            </p>
          </div>
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            <Link to="/admin/users" className="btn-primary">
              Gestionar Usuarios
            </Link>
            <Link to="/admin/nodes" className="btn-secondary">
              Gestionar Nodos
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Usuarios</h3>
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.25" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{stats.users}</div>
              <div className="widget-label">Total registrados</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Nodos</h3>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{stats.nodes}</div>
              <div className="widget-label">Total configurados</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Conectividad</h3>
              <div className="p-2 bg-success-100 rounded-lg">
                <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{stats.onlineNodes}/{stats.nodes}</div>
              <div className="widget-label">Nodos en línea</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Alertas</h3>
              <div className="p-2 bg-warning-100 rounded-lg">
                <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{stats.alerts}</div>
              <div className="widget-label">Sin leer</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <h3 className="widget-title">Estado del Sistema</h3>
              <div className={`p-2 rounded-lg ${systemHealth ? getHealthColor(systemHealth.status) : 'bg-gray-100'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="widget-value">{systemHealth?.percentage || 0}%</div>
              <div className="widget-label">
                {systemHealth?.status === 'excellent' ? 'Excelente' :
                 systemHealth?.status === 'good' ? 'Bueno' :
                 systemHealth?.status === 'warning' ? 'Advertencia' :
                 systemHealth?.status === 'critical' ? 'Crítico' : 'Desconocido'}
              </div>
            </div>
          </div>
        </div>

        {/* System Status Indicator */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Estado de Conectividad</h3>
          </div>
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'}`}></div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Servidor MQTT: {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-success-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Base de Datos: Conectada
                </span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-success-500"></div>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  API: Operativa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Nodes */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Nodos Recientes</h3>
                <Link to="/admin/nodes" className="btn-outline btn-sm">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="card-body">
              {recentNodes.length > 0 ? (
                <div className="space-y-3">
                  {recentNodes.slice(0, 5).map((node) => {
                    const status = getNodeStatus(node);
                    const realtimeData = getNodeLatestData(node.nodeId);
                    const data = realtimeData || node.latestData;
                    
                    return (
                      <div key={node._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'online' ? 'bg-success-500' :
                            status === 'warning' ? 'bg-warning-500' :
                            'bg-danger-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{node.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {node.type} • {node.owner?.firstName} {node.owner?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                          {data && (
                            <p className="text-xs text-gray-500 mt-1">
                              {moment(data.timestamp).fromNow()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No hay nodos configurados</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Usuarios Recientes</h3>
                <Link to="/admin/users" className="btn-outline btn-sm">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="card-body">
              {recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Apicultor'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.assignedNodes?.length || 0} nodos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No hay usuarios registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <AlertsWidget limit={10} />
      </div>
    </Layout>
  );
}

export default AdminDashboard;