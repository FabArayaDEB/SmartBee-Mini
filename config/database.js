// Importar el driver MySQL2 con soporte para Promises
const mysql = require('mysql2/promise');
// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

// Configuración de la conexión a la base de datos MySQL/MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',        // Servidor de base de datos
  user: process.env.DB_USER || 'root',             // Usuario de la base de datos
  password: process.env.DB_PASSWORD || '',         // Contraseña del usuario
  database: process.env.DB_NAME || 'smartbee',     // Nombre de la base de datos
  port: process.env.DB_PORT || 3306,               // Puerto de conexión (3306 por defecto para MySQL)
  waitForConnections: true,                        // Esperar conexiones disponibles cuando el pool esté lleno
  connectionLimit: 10,                             // Máximo número de conexiones simultáneas
  queueLimit: 0                                    // Máximo número de peticiones en cola (0 = sin límite)
};

// Crear un pool de conexiones para optimizar el rendimiento
// Un pool reutiliza conexiones existentes en lugar de crear nuevas para cada consulta
const db = mysql.createPool(dbConfig);

// Probar la conexión a la base de datos al inicializar
db.getConnection()
  .then(connection => {
    console.log('Pool de conexiones MySQL creado exitosamente');
    connection.release(); // Liberar la conexión de vuelta al pool
  })
  .catch(err => {
    console.error('Error al crear pool de conexiones MySQL:', err);
  });

// Exportar el pool de conexiones para uso en otras partes de la aplicación
module.exports = db;