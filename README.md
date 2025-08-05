# SmartBee Mini - Sistema de Monitoreo de Colmenas

Sistema inteligente para el monitoreo en tiempo real de colmenas de abejas utilizando sensores IoT, desarrollado con Node.js, React y MySQL.

## 📋 Requisitos Previos

- **Node.js** (versión 14 o superior)
- **npm** (incluido con Node.js)
- **MariaDB/MySQL** (versión 10.4 o superior)
- **Git** (opcional, para clonar el repositorio)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd "Smartbee Mini"
```

### 2. Instalar Dependencias

#### Backend
```bash
npm install
```

#### Frontend
```bash
cd client
npm install
cd ..
```

### 3. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar las variables:

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=smartbee
DB_PORT=3306

# JWT Secret (generar una clave segura)
JWT_SECRET=tu_clave_jwt_secreta

# MQTT Broker
MQTT_BROKER=mqtt://localhost:1883

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

### 4. Configurar Base de Datos

#### Instalar MariaDB

**Windows:**
1. Descargar MariaDB desde: https://mariadb.org/download/
2. Ejecutar el instalador
3. Durante la instalación, establecer contraseña para root
4. Completar la instalación

**Verificar instalación:**
```bash
mysql --version
```

#### Inicializar Base de Datos

El archivo `.env` ya está configurado con:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=smartbee
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
MQTT_BROKER=mqtt://localhost:1883
```

### 4. Inicializar Base de Datos

```bash
npm run init-db
```

Este comando:
- Crea la base de datos `smartbee`
- Ejecuta el esquema de tablas
- Inserta datos de prueba
- Crea usuarios de ejemplo

## 🏃‍♂️ Ejecutar el Sistema

### 1. Iniciar Backend (Puerto 5000)

```bash
npm run dev
```

El servidor backend estará disponible en: `http://localhost:5000`

### 2. Iniciar Frontend (Puerto 3000)

En una nueva terminal:

```bash
cd client
npm start
```

La aplicación web estará disponible en: `http://localhost:3000`

## 👥 Acceso al Sistema

### Usuarios de Prueba

El sistema incluye usuarios predefinidos para diferentes roles:

#### 🔧 Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Permisos:**
  - Gestión completa de usuarios
  - Gestión de nodos sensores
  - Visualización de todos los datos
  - Configuración del sistema
  - Gestión de alertas

#### 🐝 Apicultor 1
- **Usuario:** `apicultor1`
- **Contraseña:** `apicultor123`
- **Permisos:**
  - Visualización de sus nodos asignados
  - Monitoreo de datos de sensores
  - Gestión de alertas de sus colmenas
  - Actualización de perfil personal

#### 🐝 Apicultor 2
- **Usuario:** `apicultor2`
- **Contraseña:** `apicultor123`
- **Permisos:**
  - Visualización de sus nodos asignados
  - Monitoreo de datos de sensores
  - Gestión de alertas de sus colmenas
  - Actualización de perfil personal

## 🎯 Funcionalidades por Rol

### Administrador
1. **Dashboard Principal:** Vista general del sistema
2. **Gestión de Usuarios:** Crear, editar, eliminar usuarios
3. **Gestión de Nodos:** Configurar y administrar sensores
4. **Monitoreo Global:** Ver datos de todas las colmenas
5. **Sistema de Alertas:** Configurar y gestionar alertas
6. **Reportes:** Generar reportes del sistema

### Apicultor
1. **Dashboard Personal:** Vista de sus colmenas asignadas
2. **Monitoreo de Colmenas:** Datos en tiempo real de sensores
3. **Alertas Personales:** Notificaciones de sus colmenas
4. **Historial de Datos:** Consultar datos históricos
5. **Perfil:** Actualizar información personal

## 📊 Estructura del Sistema

### Backend (Puerto 5000)
- **API REST:** Endpoints para gestión de datos
- **Autenticación JWT:** Sistema de tokens seguros
- **Base de Datos MySQL:** Almacenamiento persistente
- **MQTT:** Comunicación con sensores IoT

### Frontend (Puerto 3000)
- **React:** Interfaz de usuario moderna
- **Tailwind CSS:** Estilos responsivos
- **Chart.js:** Visualización de datos
- **Axios:** Comunicación con API

## 🔧 Comandos Útiles

```bash
# Reiniciar base de datos
npm run init-db

# Ejecutar backend en modo desarrollo
npm run dev

# Ejecutar frontend
cd client && npm start

# Instalar nuevas dependencias backend
npm install <paquete>

# Instalar nuevas dependencias frontend
cd client && npm install <paquete>
```

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
1. Verificar que MariaDB esté ejecutándose
2. Confirmar credenciales en `.env`
3. Ejecutar `npm run init-db` nuevamente

### Puerto en Uso
- Backend: Cambiar puerto en `server.js`
- Frontend: Usar `PORT=3001 npm start`

### Problemas de Autenticación
1. Verificar usuarios en base de datos
2. Limpiar localStorage del navegador
3. Reiniciar servicios

## 🔒 Seguridad

### Variables de Entorno
- **NUNCA** subas el archivo `.env` al repositorio
- Usa `.env.example` como plantilla
- Genera claves JWT seguras para producción
- Cambia las credenciales por defecto en producción

### Recomendaciones
- Usa HTTPS en producción
- Configura firewall para la base de datos
- Implementa rate limiting en la API
- Mantén las dependencias actualizadas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📁 Estructura de Archivos

```
Smartbee Mini/
├── client/                 # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   └── contexts/      # Contextos de React
│   └── public/            # Archivos estáticos
├── routes/                # Rutas de API
├── middleware/            # Middleware de autenticación
├── database/              # Scripts de base de datos
├── config/                # Configuración
└── scripts/               # Scripts de utilidad
```

## 🔒 Seguridad

- Autenticación JWT con tokens seguros
- Validación de permisos por rol
- Encriptación de contraseñas con bcrypt
- Validación de entrada en todas las APIs

## 📞 Soporte

Para problemas técnicos o consultas:
1. Revisar la documentación de base de datos: `README-DATABASE.md`
2. Verificar logs en consola del navegador
3. Consultar logs del servidor backend

---

**¡El sistema SmartBee Mini está listo para monitorear tus colmenas! 🐝**