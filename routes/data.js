const express = require('express');
const moment = require('moment');
const db = require('../config/database');
const { auth, nodeOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/data/latest
// @desc    Get latest data from all user's nodes
// @access  Private
router.get('/latest', auth, async (req, res) => {
  try {
    // Get latest data for each node
    const [latestData] = await db.execute(`
      SELECT 
        n.id as nodo_id,
        n.descripcion as nodo_descripcion,
        n.tipo,
        nt.descripcion as tipo_descripcion,
        nm.payload,
        nm.fecha,
        ul.latitud,
        ul.longitud,
        ul.descripcion as ubicacion_descripcion
      FROM nodo n
      LEFT JOIN nodo_tipo nt ON n.tipo = nt.tipo
      LEFT JOIN nodo_ubicacion ul ON n.id = ul.nodo_id AND ul.activo = 1
      LEFT JOIN (
        SELECT 
          nodo_id,
          payload,
          fecha,
          ROW_NUMBER() OVER (PARTITION BY nodo_id ORDER BY fecha DESC) as rn
        FROM nodo_mensaje
      ) nm ON n.id = nm.nodo_id AND nm.rn = 1
      WHERE n.activo = 1
      ORDER BY n.id
    `);
    
    // Parse JSON payloads
    const parsedData = latestData.map(row => {
      let sensorData = null;
      if (row.payload) {
        try {
          sensorData = JSON.parse(row.payload);
        } catch (e) {
          console.error('Error parsing sensor data JSON:', e);
        }
      }
      
      return {
        nodo_id: row.nodo_id,
        nodo_descripcion: row.nodo_descripcion,
        tipo: row.tipo,
        tipo_descripcion: row.tipo_descripcion,
        ubicacion: {
          latitud: row.latitud,
          longitud: row.longitud,
          descripcion: row.ubicacion_descripcion
        },
        datos_sensor: sensorData,
        fecha: row.fecha
      };
    }).filter(data => data.datos_sensor !== null);
    
    res.json({
      success: true,
      data: parsedData
    });
    
  } catch (error) {
    console.error('Error obteniendo datos más recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/data/node/:nodeId/latest
// @desc    Get latest data from specific node
// @access  Private
router.get('/node/:nodeId/latest', auth, nodeOwnership, async (req, res) => {
  try {
    const [latestDataRows] = await db.execute(
      'SELECT ds.*, n.descripcion as node_name, n.tipo as node_type FROM datos_sensores ds LEFT JOIN nodos n ON ds.nodo_id = n.id WHERE ds.nodo_id = ? ORDER BY ds.fecha DESC LIMIT 1',
      [req.params.nodeId]
    );
    
    if (latestDataRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron datos para este nodo'
      });
    }
    
    const latestData = latestDataRows[0];
    
    res.json({
      success: true,
      data: latestData
    });
    
  } catch (error) {
    console.error('Error obteniendo datos del nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/data/node/:nodeId/historical
// @desc    Get historical data from specific node
// @access  Private
router.get('/node/:nodeId/historical', auth, nodeOwnership, async (req, res) => {
  try {
    const { period = 'day', startDate, endDate, limit = 100 } = req.query;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default periods
      end = new Date();
      switch (period) {
        case 'hour':
          start = moment().subtract(1, 'hour').toDate();
          break;
        case 'day':
          start = moment().subtract(1, 'day').toDate();
          break;
        case 'week':
          start = moment().subtract(1, 'week').toDate();
          break;
        case 'month':
          start = moment().subtract(1, 'month').toDate();
          break;
        case 'year':
          start = moment().subtract(1, 'year').toDate();
          break;
        default:
          start = moment().subtract(1, 'day').toDate();
      }
    }
    
    const [dataRows] = await db.execute(
      'SELECT * FROM datos_sensores WHERE nodo_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha ASC LIMIT ?',
      [req.params.nodeId, start, end, parseInt(limit)]
    );
    
    const data = dataRows;
    
    res.json({
      success: true,
      data,
      period: {
        start,
        end,
        period
      },
      count: data.length
    });
    
  } catch (error) {
    console.error('Error obteniendo datos históricos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/data/node/:nodeId/aggregated
// @desc    Get aggregated data from specific node
// @access  Private
router.get('/node/:nodeId/aggregated', auth, nodeOwnership, async (req, res) => {
  try {
    const { period = 'day', startDate, endDate } = req.query;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      switch (period) {
        case 'day':
          start = moment().subtract(7, 'days').toDate();
          break;
        case 'week':
          start = moment().subtract(4, 'weeks').toDate();
          break;
        case 'month':
          start = moment().subtract(12, 'months').toDate();
          break;
        case 'year':
          start = moment().subtract(5, 'years').toDate();
          break;
        default:
          start = moment().subtract(7, 'days').toDate();
      }
    }
    
    // Get aggregated data using SQL
    const [aggregatedData] = await db.execute(
      `SELECT 
        DATE_FORMAT(fecha, '%Y-%m-%d') as date,
        AVG(temperatura) as avg_temperature,
        MIN(temperatura) as min_temperature,
        MAX(temperatura) as max_temperature,
        AVG(humedad) as avg_humidity,
        MIN(humedad) as min_humidity,
        MAX(humedad) as max_humidity,
        AVG(peso) as avg_weight,
        MIN(peso) as min_weight,
        MAX(peso) as max_weight,
        COUNT(*) as readings_count
      FROM datos_sensores 
      WHERE nodo_id = ? AND fecha BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(fecha, '%Y-%m-%d')
      ORDER BY date`,
      [req.params.nodeId, start, end]
    );
    
    res.json({
      success: true,
      data: aggregatedData,
      period: {
        start,
        end,
        period
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo datos agregados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/data/node/:nodeId/stats
// @desc    Get statistics for node data
// @access  Private
router.get('/node/:nodeId/stats', auth, nodeOwnership, async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    let start;
    const end = new Date();
    
    switch (period) {
      case 'day':
        start = moment().subtract(1, 'day').toDate();
        break;
      case 'week':
        start = moment().subtract(1, 'week').toDate();
        break;
      case 'month':
        start = moment().subtract(1, 'month').toDate();
        break;
      case 'year':
        start = moment().subtract(1, 'year').toDate();
        break;
      default:
        start = moment().subtract(1, 'day').toDate();
    }
    
    const [statsRows] = await db.execute(
      `SELECT 
        AVG(temperatura) as avgTemperature,
        MIN(temperatura) as minTemperature,
        MAX(temperatura) as maxTemperature,
        AVG(humedad) as avgHumidity,
        MIN(humedad) as minHumidity,
        MAX(humedad) as maxHumidity,
        AVG(peso) as avgWeight,
        MIN(peso) as minWeight,
        MAX(peso) as maxWeight,
        COUNT(*) as totalReadings,
        MIN(fecha) as firstReading,
        MAX(fecha) as lastReading
      FROM datos_sensores 
      WHERE nodo_id = ? AND fecha BETWEEN ? AND ?`,
      [req.params.nodeId, start, end]
    );
    
    const stats = statsRows;
    
    const result = stats.length > 0 ? stats[0] : {
      avgTemperature: 0,
      minTemperature: 0,
      maxTemperature: 0,
      avgHumidity: 0,
      minHumidity: 0,
      maxHumidity: 0,
      avgWeight: 0,
      minWeight: 0,
      maxWeight: 0,
      totalReadings: 0,
      firstReading: null,
      lastReading: null
    };
    
    res.json({
      success: true,
      stats: result,
      period: {
        start,
        end,
        period
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/data/node/:nodeId
// @desc    Add sensor data (for testing purposes)
// @access  Private/Admin
router.post('/node/:nodeId', auth, async (req, res) => {
  try {
    const { temperature, humidity, weight, batteryLevel, signalStrength } = req.body;
    
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
    
    // Insert sensor data
    const [result] = await db.execute(
      'INSERT INTO datos_sensores (nodo_id, temperatura, humedad, peso, nivel_bateria, fuerza_senal, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.params.nodeId, temperature, humidity, node.tipo === 'colmena' ? weight : null, batteryLevel, signalStrength, new Date()]
    );
    
    // Update node last seen
    await db.execute(
      'UPDATE nodos SET ultima_fecha = ? WHERE id = ?',
      [new Date(), req.params.nodeId]
    );
    
    const sensorData = {
      id: result.insertId,
      nodo_id: req.params.nodeId,
      temperatura: temperature,
      humedad: humidity,
      peso: node.tipo === 'colmena' ? weight : null,
      nivel_bateria: batteryLevel,
      fuerza_senal: signalStrength,
      fecha: new Date()
    };
    
    res.status(201).json({
      success: true,
      message: 'Datos guardados exitosamente',
      data: sensorData
    });
    
  } catch (error) {
    console.error('Error guardando datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;