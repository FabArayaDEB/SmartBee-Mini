const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('Conectado a MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'smartbee';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Base de datos '${dbName}' creada o ya existe`);
    
    // Use the database
    await connection.execute(`USE \`${dbName}\``);
    console.log(`Usando base de datos '${dbName}'`);
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split SQL statements and execute them
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('Ejecutando esquema de base de datos...');
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('Esquema de base de datos ejecutado exitosamente');
    
    // Read and execute initial_data.sql
    const dataPath = path.join(__dirname, '..', 'database', 'initial_data.sql');
    const dataSQL = await fs.readFile(dataPath, 'utf8');
    
    // Split SQL statements and execute them
    const dataStatements = dataSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('Insertando datos iniciales...');
    for (const statement of dataStatements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Ignore duplicate entry errors
          if (!error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      }
    }
    console.log('Datos iniciales insertados exitosamente');
    
    console.log('\n✅ Base de datos inicializada correctamente');
    console.log('\nUsuarios de prueba creados:');
    console.log('- admin / admin123');
    console.log('- apicultor1 / apicultor123');
    console.log('- apicultor2 / apicultor123');
    
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the initialization
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;