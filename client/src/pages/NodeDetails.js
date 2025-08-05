import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NodeDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [node, setNode] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNodeDetails();
    fetchSensorData();
  }, [id]);

  const fetchNodeDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nodes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNode(data.node);
      } else {
        setError('Error al cargar detalles del nodo');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error:', err);
    }
  };

  const fetchSensorData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data/latest', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSensorData(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sensor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (activo) => {
    return activo ? 'Activo' : 'Inactivo';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Nodo no encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Detalles del Nodo</h1>
        <p className="text-gray-600">Información detallada del nodo {id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Nodo */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">ID del Nodo</label>
              <p className="text-gray-900">{node.id}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Descripción</label>
              <p className="text-gray-900">{node.descripcion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo</label>
              <p className="text-gray-900">{node.tipo_descripcion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                getStatusColor(node.activo)
              }`}>
                {getStatusText(node.activo)}
              </span>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Ubicación</h2>
          
          {node.ubicacion ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-900">{node.ubicacion.descripcion}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Coordenadas</label>
                <p className="text-gray-900">
                  Lat: {node.ubicacion.latitud}, Lng: {node.ubicacion.longitud}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Comuna</label>
                <p className="text-gray-900">{node.ubicacion.comuna}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Sin información de ubicación</p>
          )}
        </div>

        {/* Último Mensaje */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Último Mensaje</h2>
          
          {node.ultimo_mensaje ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha</label>
                <p className="text-gray-900">
                  {new Date(node.ultima_fecha).toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Datos del Sensor</label>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(node.ultimo_mensaje, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Sin mensajes recientes</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;