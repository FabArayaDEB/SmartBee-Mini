const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but only admins can create other users)
router.post('/register', async (req, res) => {
  try {
    const { id, password, role, nombre, apellido } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM usuario WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con ese ID'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    await db.execute(
      'INSERT INTO usuario (id, clave, nombre, apellido, rol, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [id, hashedPassword, nombre, apellido, role || 'apicultor', 1]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: id, role: role || 'apicultor' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: id,
        nombre: nombre,
        apellido: apellido,
        rol: role || 'apicultor'
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario y contraseña son requeridos'
      });
    }
    
    // Find user by nombre (first name)
    const [users] = await db.execute(
      'SELECT id, clave, nombre, apellido, rol FROM usuario WHERE nombre = ? AND activo = 1',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.clave);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, nombre, apellido, rol FROM usuario WHERE id = ? AND activo = 1',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
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

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const [users] = await db.execute(
      'SELECT id, clave FROM usuario WHERE id = ? AND activo = 1',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.clave);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.execute(
      'UPDATE usuario SET clave = ? WHERE id = ?',
      [hashedNewPassword, req.user.userId]
    );
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;