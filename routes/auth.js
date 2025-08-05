// Importación de librerías y módulos necesarios
const express = require('express');           // Framework web para crear rutas
const jwt = require('jsonwebtoken');          // Para generar y verificar tokens JWT
const bcrypt = require('bcryptjs');           // Para encriptar y verificar contraseñas
const db = require('../config/database');     // Conexión a la base de datos
const { auth } = require('../middleware/auth'); // Middleware de autenticación

// Crear router de Express para las rutas de autenticación
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario en el sistema
 * @access  Público (pero solo administradores pueden crear otros usuarios)
 * @body    { id, password, role, nombre, apellido }
 */
router.post('/register', async (req, res) => {
  try {
    const { id, password, role, nombre, apellido } = req.body;
    
    // Verificar si el usuario ya existe en la base de datos
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
    
    // Encriptar la contraseña usando bcrypt (factor de costo: 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear el nuevo usuario en la base de datos
    await db.execute(
      'INSERT INTO usuario (id, clave, nombre, apellido, rol, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [id, hashedPassword, nombre, apellido, role || 'apicultor', 1]
    );
    
    // Generar token JWT para autenticación automática después del registro
    const token = jwt.sign(
      { userId: id, role: role || 'apicultor' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }  // Token válido por 24 horas
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

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Público
 * @body    { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validar que se proporcionaron los campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de usuario y contraseña son requeridos'
      });
    }
    
    // Buscar usuario por nombre (campo 'nombre' en la base de datos)
    const [users] = await db.execute(
      'SELECT id, clave, nombre, apellido, rol FROM usuario WHERE nombre = ? AND activo = 1',
      [username]
    );
    
    // Verificar que el usuario existe y está activo
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // Verificar la contraseña comparando con el hash almacenado
    const isMatch = await bcrypt.compare(password, user.clave);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token JWT para la sesión del usuario
    const token = jwt.sign(
      { userId: user.id, role: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }  // Token válido por 24 horas
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