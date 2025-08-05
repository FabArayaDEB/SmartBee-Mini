import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id,
          role: user.role
        }
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Conectado al servidor Socket.IO');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado del servidor Socket.IO');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Error de conexión Socket.IO:', error);
        setIsConnected(false);
      });

      // Sensor data events
      newSocket.on('sensorData', (data) => {
        console.log('Datos de sensor recibidos:', data);
        setLatestData(prev => ({
          ...prev,
          [data.nodeId]: {
            ...data,
            timestamp: new Date()
          }
        }));
      });

      // Alert events
      newSocket.on('newAlert', (alert) => {
        console.log('Nueva alerta recibida:', alert);
        setAlerts(prev => [alert, ...prev]);
        
        // Show toast notification for new alerts
        const alertMessage = `${alert.title}: ${alert.message}`;
        
        switch (alert.severity) {
          case 'critical':
            toast.error(alertMessage, {
              autoClose: false,
              closeOnClick: false
            });
            break;
          case 'high':
            toast.error(alertMessage);
            break;
          case 'medium':
            toast.warning(alertMessage);
            break;
          case 'low':
            toast.info(alertMessage);
            break;
          default:
            toast.info(alertMessage);
        }
      });

      // Node status events
      newSocket.on('nodeStatusUpdate', (data) => {
        console.log('Actualización de estado del nodo:', data);
        // You can handle node status updates here
      });

      // System notifications
      newSocket.on('systemNotification', (notification) => {
        console.log('Notificación del sistema:', notification);
        toast.info(notification.message);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setLatestData({});
        setAlerts([]);
      }
    }
  }, [isAuthenticated, user]);

  // Function to emit events
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket no está conectado');
    }
  };

  // Function to join a room (for node-specific updates)
  const joinRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', roomName);
    }
  };

  // Function to leave a room
  const leaveRoom = (roomName) => {
    if (socket && isConnected) {
      socket.emit('leaveRoom', roomName);
    }
  };

  // Function to get latest data for a specific node
  const getNodeLatestData = (nodeId) => {
    return latestData[nodeId] || null;
  };

  // Function to clear alerts
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Function to remove specific alert
  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert._id !== alertId));
  };

  // Function to subscribe to node updates
  const subscribeToNode = (nodeId) => {
    if (socket && isConnected) {
      socket.emit('subscribeToNode', nodeId);
    }
  };

  // Function to unsubscribe from node updates
  const unsubscribeFromNode = (nodeId) => {
    if (socket && isConnected) {
      socket.emit('unsubscribeFromNode', nodeId);
    }
  };

  const value = {
    socket,
    isConnected,
    latestData,
    alerts,
    emit,
    joinRoom,
    leaveRoom,
    getNodeLatestData,
    clearAlerts,
    removeAlert,
    subscribeToNode,
    unsubscribeFromNode
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export { SocketContext };