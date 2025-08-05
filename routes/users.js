const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE u.activo = 1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.id LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (role) {
      whereClause += ' AND u.rol = ?';
      params.push(role);
    }
    
    const [users] = await db.execute(`
      SELECT u.id, u.nombre, u.apellido, u.rol, u.fecha_creacion,
             COUNT(nc.nodo_id) as nodos_asignados
      FROM usuario u
      LEFT JOIN nodo_colmena nc ON u.id = nc.usuario_id
      ${whereClause}
      GROUP BY u.id, u.nombre, u.apellido, u.rol, u.fecha_creacion
      ORDER BY u.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const [totalResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM usuario u
      ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user information
    const [users] = await db.execute(
      'SELECT id, nombre, apellido, rol, activo FROM usuario WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Get assigned nodes
    const [nodes] = await db.execute(
      'SELECT nodo_id, nombre, tipo, ubicacion, estado FROM nodos WHERE usuario_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      user: {
        ...user,
        assignedNodes: nodes
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, password, role, firstName, lastName, phone, address } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM usuarios WHERE email = ? OR nombre_usuario = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese email o nombre de usuario'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre_usuario, email, clave, rol, nombre, apellido, telefono, direccion, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, firstName, lastName, phone, address, 1]
    );
    
    const userId = result.insertId;
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: userId,
        username,
        email,
        role,
        firstName,
        lastName,
        phone,
        address
      }
    });
    
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, role, firstName, lastName, phone, address, isActive } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Check if username or email already exists (excluding current user)
    if (username !== user.nombre_usuario || email !== user.email) {
      const [existingUsers] = await db.execute(
        'SELECT * FROM usuarios WHERE (email = ? OR nombre_usuario = ?) AND id != ?',
        [email, username, req.params.id]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese email o nombre de usuario'
        });
      }
    }
    
    // Update user fields
    await db.execute(
      'UPDATE usuarios SET nombre_usuario = ?, email = ?, rol = ?, nombre = ?, apellido = ?, telefono = ?, direccion = ?, activo = ? WHERE id = ?',
      [
        username || user.nombre_usuario,
        email || user.email,
        role || user.rol,
        firstName || user.nombre,
        lastName || user.apellido,
        phone || user.telefono,
        address || user.direccion,
        isActive !== undefined ? isActive : user.activo,
        req.params.id
      ]
    );
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Soft delete
    await db.execute(
      'UPDATE usuarios SET activo = 0 WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/users/:id/assign-node
// @desc    Assign node to user
// @access  Private/Admin
router.post('/:id/assign-node', auth, adminAuth, async (req, res) => {
  try {
    const { nodeId } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    
    const [nodes] = await db.execute(
      'SELECT * FROM nodos WHERE id = ?',
      [nodeId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    // Check if node is already assigned
    const [existingAssignment] = await db.execute(
      'SELECT * FROM nodo_colmena WHERE usuario_id = ? AND nodo_id = ?',
      [req.params.id, nodeId]
    );
    
    if (existingAssignment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nodo ya está asignado a este usuario'
      });
    }
    
    // Assign node to user
    await db.execute(
      'INSERT INTO nodo_colmena (usuario_id, nodo_id) VALUES (?, ?)',
      [req.params.id, nodeId]
    );
    
    await db.execute(
      'UPDATE nodos SET usuario_id = ? WHERE id = ?',
      [req.params.id, nodeId]
    );
    
    res.json({
      success: true,
      message: 'Nodo asignado exitosamente'
    });
    
  } catch (error) {
    console.error('Error asignando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   DELETE /api/users/:id/unassign-node/:nodeId
// @desc    Unassign node from user
// @access  Private/Admin
router.delete('/:id/unassign-node/:nodeId', auth, adminAuth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    
    const [nodes] = await db.execute(
      'SELECT * FROM nodos WHERE id = ?',
      [req.params.nodeId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nodo no encontrado'
      });
    }
    
    // Remove node from user
    await db.execute(
      'DELETE FROM nodo_colmena WHERE usuario_id = ? AND nodo_id = ?',
      [req.params.id, req.params.nodeId]
    );
    
    await db.execute(
      'UPDATE nodos SET usuario_id = NULL WHERE id = ?',
      [req.params.nodeId]
    );
    
    res.json({
      success: true,
      message: 'Nodo desasignado exitosamente'
    });
    
  } catch (error) {
    console.error('Error desasignando nodo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;