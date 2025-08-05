// Importaciones necesarias para el manejo de rutas de nodos
const express = require('express'); // Framework web para Node.js
const db = require('../config/database'); // Configuración de conexión a base de datos
const { auth, adminAuth, nodeOwnership } = require('../middleware/auth'); // Middlewares de autenticación y autorización

// Crear router de Express para manejar rutas de nodos
const router = express.Router();

// @ruta   GET /api/nodes
// @desc   Obtener todos los nodos (admin) o nodos del usuario
// @acceso Privado - requiere autenticación
router.get('/', auth, async (req, res) => {
  try {
    // Extraer parámetros de consulta con valores por defecto
    const { page = 1, limit = 10, tipo = '', activo = '' } = req.query;
    
    // Construir cláusula WHERE dinámicamente
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    // Si no es admin, mostrar solo nodos del usuario
    if (req.user.role !== 'admin') {
      whereClause += ' AND EXISTS (SELECT 1 FROM nodo_colmena nc JOIN colmena c ON nc.colmena_id = c.id WHERE nc.nodo_id = n.id AND c.dueno = ?)';
      params.push(req.user.userId);
    }
    
    // Filtrar por tipo de nodo si se especifica
    if (tipo) {
      whereClause += ' AND n.tipo = ?';
      params.push(tipo);
    }
    
    // Filtrar por estado activo/inactivo si se especifica
    if (activo !== '') {
      whereClause += ' AND n.activo = ?';
      params.push(activo);
    }
    
    // Calcular offset para paginación
    const offset = (page - 1) * limit;
    
    // Obtener nodos con sus datos más recientes
    // Consulta SQL para obtener nodos con información completa
    const [nodes] = await db.execute(`
      SELECT 
        n.id,                                    -- ID único del nodo
        n.descripcion,                           -- Descripción del nodo
        n.tipo,                                  -- Tipo de nodo
        n.activo,                                -- Estado activo/inactivo
        nt.descripcion as tipo_descripcion,     -- Descripción del tipo de nodo
        ul.latitud,                              -- Coordenada latitud
        ul.longitud,                             -- Coordenada longitud
        ul.descripcion as ubicacion_descripcion, -- Descripción de ubicación
        ul.comuna,                               -- Comuna donde se ubica
        (
          SELECT nm.payload                      -- Último mensaje recibido
          FROM nodo_mensaje nm 
          WHERE nm.nodo_id = n.id 
          ORDER BY nm.fecha DESC 
          LIMIT 1
        ) as ultimo_mensaje,
        (
          SELECT nm.fecha                        -- Fecha del último mensaje
          FROM nodo_mensaje nm 
          WHERE nm.nodo_id = n.id 
          ORDER BY nm.fecha DESC 
          LIMIT 1
        ) as ultima_fecha
      FROM nodo n
      LEFT JOIN nodo_tipo nt ON n.tipo = nt.tipo                    -- Unir con tipos de nodo
      LEFT JOIN nodo_ubicacion ul ON n.id = ul.nodo_id AND ul.activo = 1  -- Unir con ubicaciones activas
      ${whereClause}
      ORDER BY n.id
      LIMIT ? OFFSET ?                                               -- Paginación
    `, [...params, parseInt(limit), offset]);
    
    // Obtener conteo total de nodos para paginación
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM nodo n
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    
    // Procesar datos de nodos y parsear JSON del último mensaje
    const nodesWithParsedData = nodes.map(node => {
      let latestData = null;
      // Intentar parsear el último mensaje JSON si existe
      if (node.ultimo_mensaje) {
        try {
          latestData = JSON.parse(node.ultimo_mensaje);
        } catch (e) {
          console.error('Error al parsear JSON del mensaje:', e);
        }
      }
      
      // Estructurar datos del nodo con formato consistente
      return {
        id: node.id,
        descripcion: node.descripcion,
        tipo: node.tipo,
        tipo_descripcion: node.tipo_descripcion,
        activo: node.activo,
        ubicacion: {
          latitud: node.latitud,
          longitud: node.longitud,
          descripcion: node.ubicacion_descripcion,
          comuna: node.comuna
        },
        ultimo_mensaje: latestData,    // Datos parseados del sensor
        ultima_fecha: node.ultima_fecha
      };
    });
    
    // Responder con datos estructurados y información de paginación
    res.json({
      success: true,
      nodes: nodesWithParsedData,
      pagination: {
        current: parseInt(page),        // Página actual
        pages: Math.ceil(total / limit), // Total de páginas
        total                           // Total de registros
      }
    });
    
  } catch (error) {
    // Manejar errores de base de datos o del servidor
    console.error('Error obteniendo nodos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @ruta   GET /api/nodes/:nodeId
// @desc   Obtener nodo específico por ID
// @acceso Privado - requiere autenticación y propiedad del nodo
router.get('/:nodeId', auth, nodeOwnership, async (req, res) => {
  try {
    // El nodo ya fue validado por el middleware nodeOwnership
    const node = req.node;
    
    // Obtener los datos más recientes del sensor
    const [latestDataRows] = await db.execute(
      'SELECT * FROM datos_sensores WHERE nodo_id = ? ORDER BY fecha DESC LIMIT 1',
      [node.id]
    );
    const latestData = latestDataRows[0] || null;
    
    // Obtener conteo de datos de las últimas 24 horas
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as count FROM datos_sensores WHERE nodo_id = ? AND fecha >= ?',
      [node.id, yesterday]
    );
    const dataCount24h = countRows[0].count;
    
    // Responder con información completa del nodo
    res.json({
      success: true,
      node: {
        ...node.toObject(),
        latestData,      // Últimos datos del sensor
        dataCount24h     // Cantidad de datos en 24h
      }
    });
    
  } catch (error) {
    // Manejar errores al obtener información del nodo
    console.error('Error obteniendo nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @ruta   POST /api/nodes
// @desc   Crear nuevo nodo en el sistema
// @acceso Privado/Admin - solo administradores
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    // Extraer datos del cuerpo de la petición
    const {
      nodeId,    // ID único del nodo
      name,      // Nombre descriptivo
      type,
      description,
      location,
      owner,
      configuration
    } = req.body;
    
    // Check if nodeId already exists
    const [existingNodes] = await db.execute(
      'SELECT * FROM nodos WHERE id = ?',
      [nodeId]
    );
    const existingNode = existingNodes[0];
    
    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un nodo con ese ID'
      });
    }
    
    await db.execute(
      'INSERT INTO nodos (id, descripcion, tipo, activo, latitud, longitud, ubicacion_descripcion, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nodeId, description || name, type, 1, location?.latitude || null, location?.longitude || null, location?.description || null, owner]
    );
    
    // Add node to user's assigned nodes (handled by foreign key relationship in MySQL)
    // No additional action needed as the owner field in nodo_colmena table handles this
    
    res.status(201).json({
      success: true,
      message: 'Nodo creado exitosamente',
      node
    });
    
  } catch (error) {
    console.error('Error creando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/nodes/:nodeId
// @desc    Update node
// @access  Private/Admin
router.put('/:nodeId', auth, adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      configuration,
      isActive,
      status
    } = req.body;
    
    const [nodes] = await db.execute(
      'SELECT * FROM nodos WHERE id = ?',
      [req.params.nodeId]
    );
    
    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    const node = nodes[0];
    
    // Update node fields
    await db.execute(
      'UPDATE nodos SET descripcion = ?, activo = ?, latitud = ?, longitud = ?, ubicacion_descripcion = ? WHERE id = ?',
      [
        description || node.descripcion,
        isActive !== undefined ? isActive : node.activo,
        location?.latitude || node.latitud,
        location?.longitude || node.longitud,
        location?.description || node.ubicacion_descripcion,
        req.params.nodeId
      ]
    );
    
    res.json({
      success: true,
      message: 'Nodo actualizado exitosamente',
      node
    });
    
  } catch (error) {
    console.error('Error actualizando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/nodes/:nodeId
// @desc    Delete node
// @access  Private/Admin
router.delete('/:nodeId', auth, adminAuth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    // Check if node exists
    const [nodes] = await db.execute(
      'SELECT * FROM nodos WHERE nodo_id = ?',
      [nodeId]
    );
    
    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    // Delete the node (user assignment is handled by foreign key relationship)
    await db.execute('DELETE FROM nodos WHERE nodo_id = ?', [nodeId]);
    
    res.json({
      success: true,
      message: 'Nodo eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/nodes/:nodeId/status
// @desc    Get node status and connectivity
// @access  Private
router.get('/:nodeId/status', auth, nodeOwnership, async (req, res) => {
  try {
    const node = req.node;
    
    // Check last data received
    const [latestDataRows] = await db.execute(
      'SELECT * FROM datos_sensores WHERE nodo_id = ? ORDER BY fecha DESC LIMIT 1',
      [node.id]
    );
    const latestData = latestDataRows[0] || null;
    
    const now = new Date();
    const lastSeen = latestData ? latestData.fecha : node.ultima_fecha;
    const minutesSinceLastData = latestData ? 
      Math.floor((now - lastSeen) / (1000 * 60)) : null;
    
    // Determine status
    let status = 'offline';
    if (minutesSinceLastData !== null) {
      if (minutesSinceLastData < 10) {
        status = 'online';
      } else if (minutesSinceLastData < 60) {
        status = 'warning';
      }
    }
    
    // Get data statistics for last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as count FROM datos_sensores WHERE nodo_id = ? AND fecha >= ?',
      [node.id, yesterday]
    );
    const dataCount = countRows[0].count;
    
    res.json({
      success: true,
      status: {
        current: status,
        lastSeen,
        minutesSinceLastData,
        dataCount24h: dataCount,
        batteryLevel: latestData?.batteryLevel,
        signalStrength: latestData?.signalStrength
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estado del nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/nodes/:nodeId/configuration
// @desc    Update node configuration
// @access  Private/Admin
router.put('/:nodeId/configuration', auth, adminAuth, async (req, res) => {
  try {
    const { configuration } = req.body;
    
    const [nodes] = await db.execute(
      'SELECT * FROM nodos WHERE id = ?',
      [req.params.nodeId]
    );
    
    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    const node = nodes[0];
    
    // Update configuration in database (assuming configuration is stored as JSON)
    await db.execute(
      'UPDATE nodos SET configuracion = ? WHERE id = ?',
      [JSON.stringify({ ...JSON.parse(node.configuracion || '{}'), ...configuration }), req.params.nodeId]
    );
    
    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      configuration: { ...JSON.parse(node.configuracion || '{}'), ...configuration }
    });
    
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;