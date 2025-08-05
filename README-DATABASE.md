# Configuración de Base de Datos - SmartBee Mini

## Instalación de MariaDB en Windows

### Opción 1: Instalación directa de MariaDB

1. **Descargar MariaDB:**
   - Ir a https://mariadb.org/download/
   - Descargar la versión estable para Windows
   - Ejecutar el instalador

2. **Configuración durante la instalación:**
   - Establecer contraseña para el usuario `root` (dejar vacía para desarrollo local)
   - Habilitar el servicio de Windows
   - Puerto por defecto: 3306

3. **Verificar instalación:**
   ```powershell
   Get-Service | Where-Object {$_.Name -like '*maria*'}
   ```

### Opción 2: Usando XAMPP

1. **Descargar XAMPP:**
   - Ir a https://www.apachefriends.org/
   - Descargar XAMPP para Windows
   - Instalar XAMPP

2. **Iniciar servicios:**
   - Abrir XAMPP Control Panel
   - Iniciar Apache y MySQL

### Opción 3: Usando Docker (Recomendado para desarrollo)

```bash
# Ejecutar MariaDB en Docker
docker run --name smartbee-mariadb \
  -e MYSQL_ROOT_PASSWORD= \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes \
  -e MYSQL_DATABASE=smartbee \
  -p 3306:3306 \
  -d mariadb:latest
```

## Configuración de la Base de Datos

### 1. Verificar conexión

Una vez que MariaDB esté ejecutándose, verificar que el servicio esté activo:

```powershell
# Verificar servicios
Get-Service | Where-Object {$_.Name -like '*mysql*' -or $_.Name -like '*maria*'}

# O verificar conexión directa
mysql -u root -p
```

### 2. Inicializar la base de datos

Ejecutar el script de inicialización:

```bash
npm run init-db
```

Este script:
- Crea la base de datos `smartbee` si no existe
- Ejecuta el esquema de tablas (`database/schema.sql`)
- Inserta datos de prueba (`database/initial_data.sql`)

### 3. Usuarios de prueba creados

Después de la inicialización, estarán disponibles estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | admin |
| apicultor1 | apicultor123 | apicultor |
| apicultor2 | apicultor123 | apicultor |

## Estructura de la Base de Datos

### Tablas principales:

- **nodo_tipo**: Tipos de nodos (ambiental, colmena)
- **rol**: Roles de usuario (admin, apicultor)
- **alerta**: Tipos de alertas del sistema
- **nodo**: Nodos sensores registrados
- **usuario**: Usuarios del sistema
- **colmena**: Información de colmenas
- **nodo_alerta**: Alertas generadas por nodos
- **nodo_mensaje**: Mensajes/datos de sensores
- **nodo_ubicacion**: Ubicaciones GPS de nodos
- **nodo_colmena**: Relación nodo-colmena

## Solución de Problemas

### Error: ECONNREFUSED

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Soluciones:**
1. Verificar que MariaDB/MySQL esté ejecutándose
2. Verificar el puerto (por defecto 3306)
3. Verificar credenciales en el archivo `.env`

### Error: Access denied

```
Error: Access denied for user 'root'@'localhost'
```

**Soluciones:**
1. Verificar contraseña del usuario root
2. Actualizar archivo `.env` con las credenciales correctas
3. Crear usuario específico para la aplicación:

```sql
CREATE USER 'smartbee'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON smartbee.* TO 'smartbee'@'localhost';
FLUSH PRIVILEGES;
```

## Configuración del archivo .env

Asegúrate de que el archivo `.env` tenga la configuración correcta:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=smartbee
DB_PORT=3306

# JWT Secret
JWT_SECRET=tu_jwt_secret_aqui

# Server Port
PORT=5000
```

## Comandos útiles

```bash
# Inicializar base de datos
npm run init-db

# Iniciar servidor de desarrollo
npm run dev

# Iniciar cliente React
cd client && npm start
```