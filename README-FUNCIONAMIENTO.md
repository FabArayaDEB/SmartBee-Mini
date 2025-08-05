# SmartBee Mini - Guía de Funcionamiento del Sistema

## 📋 Descripción General

SmartBee Mini es un sistema integral de monitoreo de colmenas que utiliza tecnología IoT (Internet de las Cosas) para recopilar datos en tiempo real de sensores instalados en las colmenas. El sistema permite a los apicultores monitorear remotamente el estado de sus colmenas y recibir alertas automáticas cuando se detectan condiciones anómalas.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Sensores IoT (Nodos)**
   - Dispositivos físicos instalados en las colmenas
   - Miden temperatura, humedad, peso y otros parámetros
   - Envían datos via protocolo MQTT

2. **Servidor Backend (Node.js)**
   - Recibe datos de sensores via MQTT
   - Procesa y almacena datos en base de datos MySQL
   - Proporciona API REST para el frontend
   - Maneja autenticación y autorización

3. **Frontend Web (React)**
   - Interfaz de usuario para visualizar datos
   - Dashboards para administradores y apicultores
   - Gráficos y alertas en tiempo real

4. **Base de Datos (MySQL/MariaDB)**
   - Almacena usuarios, nodos, datos de sensores
   - Gestiona alertas y configuraciones

## 🔄 Flujo de Datos

### 1. Recolección de Datos
```
Sensor IoT → MQTT Broker → Servidor Node.js → Base de Datos
```

1. Los sensores IoT recopilan datos (temperatura, humedad, peso)
2. Envían datos al broker MQTT usando el tópico: `smartbee/[nodo_id]/data`
3. El servidor Node.js está suscrito a estos tópicos
4. Al recibir datos, los procesa y almacena en la base de datos
5. Simultáneamente, envía los datos a clientes conectados via WebSocket

### 2. Visualización en Tiempo Real
```
Base de Datos → API REST → Frontend React → Usuario
                    ↓
              WebSocket → Actualizaciones en Tiempo Real
```

## 🔐 Sistema de Autenticación

### Roles de Usuario

1. **Administrador (`admin`)**
   - Acceso completo al sistema
   - Gestión de usuarios y nodos
   - Visualización de todos los datos

2. **Apicultor (`apicultor`)**
   - Acceso solo a sus propios nodos y colmenas
   - Visualización de datos de sus sensores
   - Gestión de su perfil

### Flujo de Autenticación

1. **Login**: Usuario envía credenciales → Servidor verifica → Genera token JWT
2. **Autorización**: Cada petición incluye token → Middleware verifica → Permite/Deniega acceso
3. **Expiración**: Tokens válidos por 24 horas

## 📊 Tipos de Datos Monitoreados

### Datos de Sensores
- **Temperatura**: Temperatura interna de la colmena (°C)
- **Humedad**: Humedad relativa interna (%)
- **Peso**: Peso total de la colmena (kg)
- **Timestamp**: Fecha y hora de la medición

### Formato de Datos MQTT
```json
{
  "temperatura": 35.2,
  "humedad": 65.8,
  "peso": 45.3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚨 Sistema de Alertas

### Tipos de Alertas
- **Temperatura Alta/Baja**: Fuera del rango óptimo (30-37°C)
- **Humedad Anómala**: Niveles críticos de humedad
- **Pérdida de Peso**: Disminución significativa del peso
- **Desconexión**: Nodo sin enviar datos por tiempo prolongado

### Procesamiento de Alertas
1. El sistema evalúa cada dato recibido
2. Compara con umbrales configurados
3. Genera alerta si se detecta anomalía
4. Almacena alerta en base de datos
5. Notifica a usuarios via interfaz web

## 🗄️ Estructura de Base de Datos

### Tablas Principales

- **`usuario`**: Información de administradores y apicultores
- **`nodo`**: Dispositivos IoT registrados en el sistema
- **`nodo_mensaje`**: Datos recibidos de sensores
- **`colmena`**: Información de colmenas
- **`alerta`**: Tipos de alertas configuradas
- **`nodo_alerta`**: Alertas generadas por el sistema

### Relaciones Clave
- Un usuario puede tener múltiples colmenas
- Una colmena puede tener múltiples nodos
- Un nodo genera múltiples mensajes de datos
- Las alertas se asocian a nodos específicos

## 🌐 API REST

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener información del usuario actual

#### Nodos
- `GET /api/nodes` - Listar nodos del usuario
- `GET /api/nodes/:id` - Obtener detalles de un nodo
- `POST /api/nodes` - Crear nuevo nodo (admin)

#### Datos
- `GET /api/data/latest` - Últimos datos de todos los nodos
- `GET /api/data/node/:id/historical` - Datos históricos de un nodo
- `GET /api/data/node/:id/stats` - Estadísticas de un nodo

#### Alertas
- `GET /api/alerts` - Listar alertas del usuario
- `POST /api/alerts/:id/acknowledge` - Marcar alerta como vista

## 🔧 Configuración del Sistema

### Variables de Entorno Clave

```env
# Base de Datos
DB_HOST=localhost          # Servidor MySQL
DB_USER=smartbee_user      # Usuario de base de datos
DB_PASSWORD=password       # Contraseña
DB_NAME=smartbee          # Nombre de la base de datos

# Seguridad
JWT_SECRET=clave_secreta   # Clave para tokens JWT

# MQTT
MQTT_BROKER=mqtt://localhost:1883  # Broker MQTT

# Servidor
PORT=5000                  # Puerto del servidor
NODE_ENV=production        # Entorno de ejecución
```

### Configuración MQTT

- **Broker**: Mosquitto (recomendado)
- **Puerto**: 1883 (estándar MQTT)
- **Tópicos**: `smartbee/[nodo_id]/data`
- **QoS**: 1 (entrega garantizada)

## 🚀 Proceso de Despliegue

### Desarrollo
1. Instalar dependencias: `npm install`
2. Configurar variables de entorno
3. Inicializar base de datos: `npm run init-db`
4. Ejecutar en modo desarrollo: `npm run dev`

### Producción
1. Construir frontend: `npm run build`
2. Configurar variables de entorno de producción
3. Ejecutar servidor: `npm start`
4. Configurar proxy reverso (Nginx recomendado)

## 📈 Monitoreo y Mantenimiento

### Logs del Sistema
- Conexiones MQTT
- Errores de base de datos
- Autenticación de usuarios
- Procesamiento de datos

### Métricas Importantes
- Número de nodos activos
- Frecuencia de datos recibidos
- Alertas generadas por día
- Usuarios activos

### Respaldo de Datos
- Respaldo diario de base de datos
- Retención de datos históricos
- Archivado de logs del sistema

## 🔍 Solución de Problemas

### Problemas Comunes

1. **Nodo no envía datos**
   - Verificar conexión MQTT
   - Revisar configuración de red
   - Comprobar estado del sensor

2. **Datos no aparecen en interfaz**
   - Verificar conexión a base de datos
   - Revisar logs del servidor
   - Comprobar permisos de usuario

3. **Alertas no se generan**
   - Verificar configuración de umbrales
   - Revisar procesamiento de datos
   - Comprobar reglas de alertas

## 📚 Tecnologías Utilizadas

### Backend
- **Node.js**: Entorno de ejecución JavaScript
- **Express.js**: Framework web
- **MySQL2**: Driver de base de datos
- **MQTT.js**: Cliente MQTT
- **Socket.IO**: WebSockets para tiempo real
- **JWT**: Autenticación con tokens
- **bcrypt**: Encriptación de contraseñas

### Frontend
- **React**: Librería de interfaz de usuario
- **React Router**: Enrutamiento
- **Chart.js**: Gráficos y visualizaciones
- **Tailwind CSS**: Framework de estilos
- **Axios**: Cliente HTTP

### Base de Datos
- **MySQL/MariaDB**: Sistema de gestión de base de datos
- **Índices optimizados**: Para consultas rápidas
- **Integridad referencial**: Claves foráneas

### Comunicación IoT
- **MQTT**: Protocolo de mensajería ligero
- **JSON**: Formato de intercambio de datos
- **WebSockets**: Comunicación bidireccional en tiempo real

Este sistema proporciona una solución completa y escalable para el monitoreo moderno de colmenas, combinando tecnologías IoT con una interfaz web intuitiva y un backend robusto.