const express = require('express');
const db = require('../config/database');
const { auth, adminAuth, nodeOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/nodes
// @desc    Get all nodes (admin) or user's nodes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, tipo = '', activo = '' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    // If not admin, only show user's nodes (for now, show all nodes)
    // TODO: Implement node ownership logic
    
    if (tipo) {
      whereClause += ' AND n.tipo = ?';
      params.push(tipo);
    }
    
    if (activo !== '') {
      whereClause += ' AND n.activo = ?';
      params.push(activo);
    }
    
    const offset = (page - 1) * limit;
    
    // Get nodes with their latest data
    const [nodes] = await db.execute(`
      SELECT 
        n.id,
        n.descripcion,
        n.tipo,
        n.activo,
        nt.descripcion as tipo_descripcion,
        ul.latitud,
        ul.longitud,
        ul.descripcion as ubicacion_descripcion,
        ul.comuna,
        (
          SELECT nm.payload 
          FROM nodo_mensaje nm 
          WHERE nm.nodo_id = n.id 
          ORDER BY nm.fecha DESC 
          LIMIT 1
        ) as ultimo_mensaje,
        (
          SELECT nm.fecha 
          FROM nodo_mensaje nm 
          WHERE nm.nodo_id = n.id 
          ORDER BY nm.fecha DESC 
          LIMIT 1
        ) as ultima_fecha
      FROM nodo n
      LEFT JOIN nodo_tipo nt ON n.tipo = nt.tipo
      LEFT JOIN nodo_ubicacion ul ON n.id = ul.nodo_id AND ul.activo = 1
      ${whereClause}
      ORDER BY n.id
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM nodo n
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    
    // Parse latest message JSON if exists
    const nodesWithParsedData = nodes.map(node => {
      let latestData = null;
      if (node.ultimo_mensaje) {
        try {
          latestData = JSON.parse(node.ultimo_mensaje);
        } catch (e) {
          console.error('Error parsing message JSON:', e);
        }
      }
      
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
        ultimo_mensaje: latestData,
        ultima_fecha: node.ultima_fecha
      };
    });
    
    res.json({
      success: true,
      nodes: nodesWithParsedData,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo nodos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/nodes/:nodeId
// @desc    Get node by ID
// @access  Private
router.get('/:nodeId', auth, nodeOwnership, async (req, res) => {
  try {
    const node = req.node;
    
    // Get latest sensor data
    const [latestDataRows] = await db.execute(
      'SELECT * FROM datos_sensores WHERE nodo_id = ? ORDER BY fecha DESC LIMIT 1',
      [node.id]
    );
    const latestData = latestDataRows[0] || null;
    
    // Get data count for last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [countRows] = await db.execute(
      'SELECT COUNT(*) as count FROM datos_sensores WHERE nodo_id = ? AND fecha >= ?',
      [node.id, yesterday]
    );
    const dataCount24h = countRows[0].count;
    
    res.json({
      success: true,
      node: {
        ...node.toObject(),
        latestData,
        dataCount24h
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/nodes
// @desc    Create new node
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      nodeId,
      name,
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