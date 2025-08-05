const express = require('express');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/alerts
// @desc    Get alerts for user or all alerts (admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, isRead, isResolved } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    // If not admin, only show user's alerts
    if (req.user.role !== 'admin') {
      whereClause += ' AND a.usuario_id = ?';
      params.push(req.user.userId);
    }
    
    // Apply filters
    if (severity) {
      whereClause += ' AND a.severidad = ?';
      params.push(severity);
    }
    
    if (isRead !== undefined) {
      whereClause += ' AND a.leida = ?';
      params.push(isRead === 'true' ? 1 : 0);
    }
    
    if (isResolved !== undefined) {
      whereClause += ' AND a.resuelta = ?';
      params.push(isResolved === 'true' ? 1 : 0);
    }
    
    const offset = (page - 1) * limit;
    
    // Get alerts with node information
    const [alerts] = await db.execute(`
      SELECT 
        na.id,
        na.nodo_id,
        na.alerta_id,
        na.fecha,
        n.descripcion as nodo_descripcion,
        a.nombre as alerta_nombre,
        a.descripcion as alerta_descripcion,
        a.indicador
      FROM nodo_alerta na
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN alerta a ON na.alerta_id = a.id
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id
      ${whereClause.replace('a.usuario_id', 'c.dueno')}
      ORDER BY na.fecha DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const [totalResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM nodo_alerta na
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id
      ${whereClause.replace('a.usuario_id', 'c.dueno')}
    `, params);
    
    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: alerts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/alerts/unread
// @desc    Get unread alerts count for user
// @access  Private
router.get('/unread', auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM nodo_alerta na LEFT JOIN nodo n ON na.nodo_id = n.id LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id LEFT JOIN colmena c ON nc.colmena_id = c.id WHERE c.dueno = ?',
      [req.user.userId]
    );
    
    res.json({
      success: true,
      count: result[0].count
    });
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/alerts/node/:nodeId
// @desc    Get alerts for specific node
// @access  Private
router.get('/node/:nodeId', auth, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if user has access to this node
    let nodeQuery = 'SELECT * FROM nodos WHERE id = ?';
    let nodeParams = [nodeId];
    
    if (req.user.role !== 'admin') {
      nodeQuery += ' AND usuario_id = ?';
      nodeParams.push(req.user.userId);
    }
    
    const [nodeResult] = await db.execute(nodeQuery, nodeParams);
    
    if (nodeResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado o sin acceso'
      });
    }
    
    const offset = (page - 1) * limit;
    
    // Get alerts for this node
    const [alerts] = await db.execute(`
      SELECT 
        a.id,
        a.nodo_id,
        a.tipo_alerta_id,
        a.mensaje,
        a.severidad,
        a.leida,
        a.resuelta,
        a.fecha_creacion,
        a.fecha_lectura,
        a.fecha_resolucion,
        ta.nombre as tipo_nombre,
        ta.descripcion as tipo_descripcion
      FROM alertas a
      LEFT JOIN tipos_alertas ta ON a.tipo_alerta_id = ta.id
      WHERE a.nodo_id = ?
      ORDER BY a.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [nodeId, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching node alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/alerts/stats
// @desc    Get alert statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    // If not admin, only show user's alerts
    if (req.user.role !== 'admin') {
      whereClause += ' AND usuario_id = ?';
      params.push(req.user.userId);
    }
    
    // Get alert statistics using SQL
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) as unread,
        COUNT(*) as unresolved,
        SUM(CASE WHEN a.indicador LIKE '%CRIT%' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN a.indicador LIKE '%HIGH%' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN a.indicador LIKE '%MED%' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN a.indicador LIKE '%LOW%' THEN 1 ELSE 0 END) as low
      FROM nodo_alerta na
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN alerta a ON na.alerta_id = a.id
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id
      ${whereClause.replace('usuario_id', 'c.dueno')}`,
      params
    );
    
    // Get alert type statistics using SQL
    const [typeStats] = await db.execute(
      `SELECT a.nombre as _id, COUNT(*) as count
      FROM nodo_alerta na
      LEFT JOIN nodo n ON na.nodo_id = n.id
      LEFT JOIN alerta a ON na.alerta_id = a.id
      LEFT JOIN nodo_colmena nc ON n.id = nc.nodo_id
      LEFT JOIN colmena c ON nc.colmena_id = c.id
      ${whereClause.replace('usuario_id', 'c.dueno')}
      GROUP BY a.nombre
      ORDER BY count DESC`,
      params
    );
    
    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      unread: 0,
      unresolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    res.json({
      success: true,
      data: {
        overview: result,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/alerts/:id/read
// @desc    Mark alert as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if alert exists and user has access
    let alertQuery = 'SELECT * FROM alertas WHERE id = ?';
    let alertParams = [id];
    
    if (req.user.role !== 'admin') {
      alertQuery += ' AND usuario_id = ?';
      alertParams.push(req.user.userId);
    }
    
    const [alertResult] = await db.execute(alertQuery, alertParams);
    
    if (alertResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada o sin acceso'
      });
    }
    
    // Mark as read
    await db.execute(
      'UPDATE alertas SET leida = 1, fecha_lectura = NOW() WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Alerta marcada como leída'
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/alerts/:id/resolve
// @desc    Mark alert as resolved
// @access  Private
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if alert exists and user has access
    let alertQuery = 'SELECT * FROM alertas WHERE id = ?';
    let alertParams = [id];
    
    if (req.user.role !== 'admin') {
      alertQuery += ' AND usuario_id = ?';
      alertParams.push(req.user.userId);
    }
    
    const [alertResult] = await db.execute(alertQuery, alertParams);
    
    if (alertResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada o sin acceso'
      });
    }
    
    // Mark as resolved and read
    await db.execute(
      'UPDATE alertas SET resuelta = 1, leida = 1, fecha_resolucion = NOW(), fecha_lectura = COALESCE(fecha_lectura, NOW()) WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Alerta resuelta'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/alerts/mark-all-read
// @desc    Mark all alerts as read for user
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    let updateQuery = 'UPDATE alertas SET leida = 1, fecha_lectura = NOW() WHERE leida = 0';
    let params = [];
    
    if (req.user.role !== 'admin') {
      updateQuery += ' AND usuario_id = ?';
      params.push(req.user.userId);
    }
    
    await db.execute(updateQuery, params);
    
    res.json({
      success: true,
      message: 'Todas las alertas marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/alerts/test
// @desc    Create test alert (admin only)
// @access  Private (Admin)
router.post('/test', auth, adminAuth, async (req, res) => {
  try {
    const { nodo_id, tipo_alerta_id, mensaje, severidad, usuario_id } = req.body;
    
    // Validate required fields
    if (!nodo_id || !tipo_alerta_id || !mensaje || !severidad || !usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }
    
    // Create test alert
    const [result] = await db.execute(
      `INSERT INTO alertas (nodo_id, tipo_alerta_id, mensaje, severidad, usuario_id, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [nodo_id, tipo_alerta_id, mensaje, severidad, usuario_id]
    );
    
    res.json({
      success: true,
      message: 'Alerta de prueba creada',
      alertId: result.insertId
    });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;