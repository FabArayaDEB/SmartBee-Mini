// Importar librerías necesarias
const jwt = require('jsonwebtoken');        // Para verificar tokens JWT
const db = require('../config/database');   // Conexión a la base de datos

/**
 * Middleware de Autenticación
 * Verifica que el usuario tenga un token JWT válido antes de acceder a rutas protegidas
 * 
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP  
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const auth = async (req, res, next) => {
  try {
    // Extraer el token del header Authorization (formato: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Verificar que se proporcionó un token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de acceso'
      });
    }
    
    // Verificar y decodificar el token JWT usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos para verificar que existe y está activo
    const [users] = await db.execute(
      'SELECT id, nombre, apellido, rol FROM usuario WHERE id = ? AND activo = 1',
      [decoded.userId]
    );
    
    // Verificar que el usuario existe y está activo
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }
    
    const user = users[0];
    
    // Agregar información del usuario al objeto request para uso en siguientes middlewares
    req.user = {
      userId: user.id,
      role: user.rol,
      nombre: user.nombre,
      apellido: user.apellido
    };
    
    // Continuar al siguiente middleware o ruta
    next();
    
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware de Autorización de Administrador
 * Verifica que el usuario autenticado tenga rol de administrador
 * NOTA: Este middleware debe usarse después del middleware 'auth'
 * 
 * @param {Object} req - Objeto de petición HTTP (debe contener req.user del middleware auth)
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const adminAuth = (req, res, next) => {
  // Verificar que el usuario tiene rol de administrador
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  // Si es admin, continuar al siguiente middleware o ruta
  next();
};

/**
 * Middleware de Verificación de Propiedad de Nodo
 * Verifica que el usuario tenga permisos para acceder a un nodo específico
 * Los administradores pueden acceder a todos los nodos
 * Los apicultores solo pueden acceder a sus propios nodos
 * NOTA: Este middleware debe usarse después del middleware 'auth'
 * 
 * @param {Object} req - Objeto de petición HTTP (debe contener req.user y req.params.nodeId)
 * @param {Object} res - Objeto de respuesta HTTP
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const nodeOwnership = async (req, res, next) => {
  try {
    // Obtener el ID del nodo desde los parámetros de la URL
    const { nodeId } = req.params;
    
    // Buscar el nodo en la base de datos
    const [rows] = await db.execute(
      'SELECT * FROM nodos WHERE nodo_id = ?',
      [nodeId]
    );
    
    // Verificar que el nodo existe
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    const node = rows[0];
    
    // Los administradores pueden acceder a todos los nodos
    if (req.user.role === 'admin') {
      req.node = node;  // Agregar información del nodo al request
      return next();
    }
    
    // Verificar que el usuario es propietario del nodo
    if (node.usuario_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este nodo'
      });
    }
    
    // Si el usuario es propietario, agregar el nodo al request y continuar
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

// Exportar todos los middlewares para uso en las rutas
module.exports = {
  auth,           // Middleware de autenticación básica
  adminAuth,      // Middleware de autorización de administrador
  nodeOwnership   // Middleware de verificación de propiedad de nodo
};