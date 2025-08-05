const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de acceso'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.execute(
      'SELECT id, nombre, apellido, rol FROM usuario WHERE id = ? AND activo = 1',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }
    
    const user = users[0];
    
    req.user = {
      userId: user.id,
      role: user.rol,
      nombre: user.nombre,
      apellido: user.apellido
    };
    
    next();
    
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Admin authorization middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  next();
};

// Node ownership middleware
const nodeOwnership = async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    
    const [rows] = await db.execute(
      'SELECT * FROM nodos WHERE nodo_id = ?',
      [nodeId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    const node = rows[0];
    
    // Admin can access all nodes
    if (req.user.role === 'admin') {
      req.node = node;
      return next();
    }
    
    // Check if user owns the node
    if (node.usuario_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este nodo'
      });
    }
    
    req.node = node;
    next();
    
  } catch (error) {
    console.error('Error verificando propiedad del nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  nodeOwnership
};