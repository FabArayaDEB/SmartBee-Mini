const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartbee',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('Pool de conexiones MySQL creado exitosamente');
    connection.release();
  })
  .catch(err => {
    console.error('Error al crear pool de conexiones MySQL:', err);
  });

module.exports = db;