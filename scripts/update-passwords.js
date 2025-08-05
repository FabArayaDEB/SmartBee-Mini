const db = require('../config/database');

async function updatePasswords() {
  try {
    // Actualizar contraseña del admin
    await db.execute(
      'UPDATE usuario SET clave = ? WHERE id = ?',
      ['$2a$10$lsSgspKACZhJgHN3oSXwPeizFHBOe07AionM0ZSqc50bXXBZvB9Ze', 'admin']
    );
    console.log('Contraseña del admin actualizada');
    
    // Actualizar contraseña de apicultor1
    await db.execute(
      'UPDATE usuario SET clave = ? WHERE id = ?',
      ['$2a$10$XJiKMj.1n1Xzky72SHWz6OvYuREPIVlM6MrvkMtyxhpmMaZ.Z/Y.O', 'apicultor1']
    );
    console.log('Contraseña de apicultor1 actualizada');
    
    // Actualizar contraseña de apicultor2
    await db.execute(
      'UPDATE usuario SET clave = ? WHERE id = ?',
      ['$2a$10$XJiKMj.1n1Xzky72SHWz6OvYuREPIVlM6MrvkMtyxhpmMaZ.Z/Y.O', 'apicultor2']
    );
    console.log('Contraseña de apicultor2 actualizada');
    
    // Verificar los usuarios
    const [users] = await db.execute('SELECT id, nombre, apellido FROM usuario WHERE activo = 1');
    console.log('\nUsuarios en la base de datos:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido}`);
    });
    
    console.log('\nCredenciales de acceso:');
    console.log('- Admin: nombre="Administrador", contraseña="admin123"');
    console.log('- Apicultor: nombre="Juan", contraseña="apicultor123"');
    console.log('- Apicultor: nombre="María", contraseña="apicultor123"');
    
  } catch (error) {
    console.error('Error al actualizar contraseñas:', error);
  } finally {
    process.exit(0);
  }
}

updatePasswords();