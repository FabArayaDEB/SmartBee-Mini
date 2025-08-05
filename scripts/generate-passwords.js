const bcrypt = require('bcryptjs');

async function generatePasswords() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const apicultorPassword = await bcrypt.hash('apicultor123', 10);
    
    console.log('Contraseñas hasheadas:');
    console.log('admin123:', adminPassword);
    console.log('apicultor123:', apicultorPassword);
    
    console.log('\nSQL para actualizar:');
    console.log(`UPDATE usuario SET clave = '${adminPassword}' WHERE id = 'admin';`);
    console.log(`UPDATE usuario SET clave = '${apicultorPassword}' WHERE id = 'apicultor1';`);
    console.log(`UPDATE usuario SET clave = '${apicultorPassword}' WHERE id = 'apicultor2';`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generatePasswords();