# 🧪 Guía de Pruebas - SmartBee Mini

## Descripción General

Esta guía describe cómo realizar pruebas completas para verificar que el sistema SmartBee Mini recibe, almacena y muestra correctamente los datos y alertas de los nodos IoT de las colmenas.

## 📋 Índice

1. [Preparación del Entorno de Pruebas](#preparación-del-entorno-de-pruebas)
2. [Pruebas de Conectividad MQTT](#pruebas-de-conectividad-mqtt)
3. [Pruebas de Recepción de Datos](#pruebas-de-recepción-de-datos)
4. [Pruebas de Almacenamiento en Base de Datos](#pruebas-de-almacenamiento-en-base-de-datos)
5. [Pruebas de Visualización en Frontend](#pruebas-de-visualización-en-frontend)
6. [Pruebas del Sistema de Alertas](#pruebas-del-sistema-de-alertas)
7. [Pruebas de Tiempo Real (WebSockets)](#pruebas-de-tiempo-real-websockets)
8. [Herramientas de Prueba](#herramientas-de-prueba)
9. [Casos de Prueba Específicos](#casos-de-prueba-específicos)

---

## 🔧 Preparación del Entorno de Pruebas

### 1. Verificar Servicios Activos

```bash
# Verificar que el servidor Node.js esté ejecutándose
node server.js

# Verificar que el frontend React esté activo
cd client && npm start

# Verificar que MySQL/MariaDB esté ejecutándose
mysql -u root -p
```

### 2. Configurar Variables de Entorno

Asegúrate de que el archivo `.env` contenga:

```env
# Base de datos
DB_HOST=localhost
DB_USER=smartbee_user
DB_PASSWORD=tu_password
DB_NAME=smartbee_db

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=smartbee
MQTT_PASSWORD=tu_mqtt_password

# JWT
JWT_SECRET=tu_jwt_secret

# Puerto del servidor
PORT=5000
```

### 3. Verificar Broker MQTT

```bash
# Instalar Mosquitto (si no está instalado)
# Windows: descargar desde https://mosquitto.org/download/
# Linux: sudo apt-get install mosquitto mosquitto-clients

# Iniciar broker MQTT
mosquitto -c mosquitto.conf
```

---

## 📡 Pruebas de Conectividad MQTT

### 1. Prueba Básica de Conexión

```bash
# Terminal 1: Suscribirse a todos los tópicos
mosquitto_sub -h localhost -p 1883 -t "smartbee/+/+" -v

# Terminal 2: Publicar mensaje de prueba
mosquitto_pub -h localhost -p 1883 -t "smartbee/node1/data" -m '{"temperature":25.5,"humidity":60.2,"weight":45.8}'
```

### 2. Verificar Autenticación MQTT

```bash
# Con credenciales correctas
mosquitto_pub -h localhost -p 1883 -u smartbee -P tu_mqtt_password -t "smartbee/test" -m "test"

# Sin credenciales (debería fallar)
mosquitto_pub -h localhost -p 1883 -t "smartbee/test" -m "test"
```

---

## 📊 Pruebas de Recepción de Datos

### 1. Simular Datos de Nodo Real

Crea un script de prueba `test-mqtt-publisher.js`:

```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'smartbee',
  password: 'tu_mqtt_password'
});

client.on('connect', () => {
  console.log('Conectado al broker MQTT');
  
  // Simular datos de diferentes nodos
  const nodes = ['node1', 'node2', 'node3'];
  
  setInterval(() => {
    nodes.forEach(nodeId => {
      const data = {
        temperature: (Math.random() * 10 + 20).toFixed(1), // 20-30°C
        humidity: (Math.random() * 20 + 50).toFixed(1),    // 50-70%
        weight: (Math.random() * 10 + 40).toFixed(1),      // 40-50kg
        timestamp: new Date().toISOString()
      };
      
      client.publish(`smartbee/${nodeId}/data`, JSON.stringify(data));
      console.log(`Enviado a ${nodeId}:`, data);
    });
  }, 5000); // Cada 5 segundos
});

client.on('error', (error) => {
  console.error('Error MQTT:', error);
});
```

### 2. Ejecutar Simulador

```bash
node test-mqtt-publisher.js
```

### 3. Verificar Logs del Servidor

En la consola del servidor Node.js deberías ver:

```
Mensaje MQTT recibido en smartbee/node1/data: {"temperature":"25.3","humidity":"62.1","weight":"43.7","timestamp":"2024-01-15T10:30:00.000Z"}
Datos guardados para nodo: node1
```

---

## 🗄️ Pruebas de Almacenamiento en Base de Datos

### 1. Verificar Inserción de Datos

```sql
-- Conectar a la base de datos
mysql -u smartbee_user -p smartbee_db

-- Verificar últimos mensajes recibidos
SELECT 
    nm.id,
    n.nombre as nodo,
    nm.payload,
    nm.timestamp
FROM nodo_mensaje nm
JOIN nodo n ON nm.nodo_id = n.id
ORDER BY nm.timestamp DESC
LIMIT 10;

-- Verificar datos por nodo específico
SELECT 
    payload,
    timestamp
FROM nodo_mensaje nm
JOIN nodo n ON nm.nodo_id = n.id
WHERE n.nombre = 'node1'
ORDER BY timestamp DESC
LIMIT 5;
```

### 2. Verificar Estructura de Datos JSON

```sql
-- Extraer valores específicos del JSON
SELECT 
    n.nombre,
    JSON_EXTRACT(nm.payload, '$.temperature') as temperatura,
    JSON_EXTRACT(nm.payload, '$.humidity') as humedad,
    JSON_EXTRACT(nm.payload, '$.weight') as peso,
    nm.timestamp
FROM nodo_mensaje nm
JOIN nodo n ON nm.nodo_id = n.id
WHERE nm.timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY nm.timestamp DESC;
```

### 3. Verificar Integridad de Datos

```sql
-- Contar mensajes por nodo en las últimas 24 horas
SELECT 
    n.nombre,
    COUNT(*) as total_mensajes,
    MIN(nm.timestamp) as primer_mensaje,
    MAX(nm.timestamp) as ultimo_mensaje
FROM nodo_mensaje nm
JOIN nodo n ON nm.nodo_id = n.id
WHERE nm.timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY n.id, n.nombre;
```

---

## 🖥️ Pruebas de Visualización en Frontend

### 1. Pruebas de Dashboard

**Pasos:**
1. Abrir navegador en `http://localhost:3000`
2. Iniciar sesión con usuario apicultor
3. Verificar que se muestren los nodos asignados
4. Comprobar que los datos se actualizan automáticamente

**Verificaciones:**
- ✅ Los nodos aparecen en la lista
- ✅ Los valores de sensores se muestran correctamente
- ✅ Los timestamps son recientes
- ✅ Los datos se actualizan sin recargar la página

### 2. Pruebas de Detalles de Nodo

**Pasos:**
1. Hacer clic en un nodo específico
2. Verificar que se muestren los datos históricos
3. Comprobar gráficos y estadísticas

**Verificaciones:**
- ✅ Datos históricos se cargan correctamente
- ✅ Gráficos muestran tendencias
- ✅ Valores actuales coinciden con la base de datos

### 3. Pruebas de Tiempo Real

**Pasos:**
1. Mantener abierto el dashboard
2. Ejecutar el simulador MQTT
3. Observar actualizaciones en tiempo real

**Verificaciones:**
- ✅ Los valores se actualizan automáticamente
- ✅ No hay necesidad de recargar la página
- ✅ Las actualizaciones son fluidas

---

## 🚨 Pruebas del Sistema de Alertas

### 1. Configurar Umbrales de Alerta

```sql
-- Insertar reglas de alerta de prueba
INSERT INTO nodo_alerta (nodo_id, tipo_alerta, umbral_min, umbral_max, activa) VALUES
(1, 'temperature', 15.0, 35.0, 1),
(1, 'humidity', 40.0, 80.0, 1),
(1, 'weight', 30.0, 60.0, 1);
```

### 2. Simular Condiciones de Alerta

Modifica el simulador para enviar valores fuera de rango:

```javascript
// Datos que deberían generar alertas
const alertData = {
  temperature: 40.0,  // Muy alta
  humidity: 90.0,     // Muy alta
  weight: 25.0,       // Muy baja
  timestamp: new Date().toISOString()
};

client.publish('smartbee/node1/data', JSON.stringify(alertData));
```

### 3. Verificar Generación de Alertas

```sql
-- Verificar alertas generadas
SELECT 
    a.tipo,
    a.mensaje,
    a.timestamp,
    n.nombre as nodo
FROM alerta a
JOIN nodo n ON a.nodo_id = n.id
ORDER BY a.timestamp DESC
LIMIT 10;
```

### 4. Verificar Notificaciones en Frontend

**Verificaciones:**
- ✅ Aparecen notificaciones toast
- ✅ Se actualiza el contador de alertas
- ✅ Las alertas aparecen en la página de alertas
- ✅ Se muestran con el color/icono correcto

---

## ⚡ Pruebas de Tiempo Real (WebSockets)

### 1. Verificar Conexión WebSocket

En la consola del navegador (F12):

```javascript
// Verificar que Socket.IO esté conectado
console.log(window.io);

// Escuchar eventos de datos
socket.on('newData', (data) => {
  console.log('Nuevos datos recibidos:', data);
});

// Escuchar eventos de alertas
socket.on('newAlert', (alert) => {
  console.log('Nueva alerta recibida:', alert);
});
```

### 2. Verificar Emisión de Eventos

En el servidor, verificar que se emitan eventos:

```javascript
// En server.js, agregar logs
io.emit('newData', {
  nodeId: nodeId,
  data: parsedData,
  timestamp: new Date()
});
console.log('Evento newData emitido para nodo:', nodeId);
```

---

## 🛠️ Herramientas de Prueba

### 1. Scripts Automatizados (Recomendado)

**Verificación completa del sistema:**
```bash
npm run test:health
```

**Simulación de datos MQTT:**
```bash
# Simulación completa (5 minutos)
npm run test:mqtt

# Solo datos de alerta
npm run test:alerts

# Ejecutar todas las pruebas
npm run test:all
```

**Scripts individuales:**
```bash
# Verificar salud del sistema
node scripts/test-system-health.js

# Simular datos MQTT
node scripts/test-mqtt-publisher.js

# Solo alertas
node scripts/test-mqtt-publisher.js --alerts-only
```

### 2. MQTT Explorer
- Descargar: http://mqtt-explorer.com/
- Conectar a `localhost:1883`
- Monitorear tópicos `smartbee/+/+`

### 3. Postman/Insomnia

Pruebas de API REST:

```http
# Obtener datos más recientes
GET http://localhost:5000/api/data/latest
Authorization: Bearer YOUR_JWT_TOKEN

# Obtener datos de nodo específico
GET http://localhost:5000/api/data/node/1/latest
Authorization: Bearer YOUR_JWT_TOKEN

# Obtener alertas
GET http://localhost:5000/api/alerts
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. MySQL Workbench
- Conectar a la base de datos
- Monitorear tablas en tiempo real
- Ejecutar consultas de verificación

---

## 📝 Casos de Prueba Específicos

### Caso 1: Flujo Completo de Datos

**Objetivo:** Verificar el flujo completo desde sensor hasta visualización

**Pasos:**
1. Enviar datos vía MQTT
2. Verificar recepción en servidor
3. Confirmar almacenamiento en BD
4. Verificar visualización en frontend
5. Comprobar actualización en tiempo real

**Criterios de Éxito:**
- ✅ Datos llegan al servidor en <1 segundo
- ✅ Se almacenan correctamente en BD
- ✅ Aparecen en frontend en <2 segundos
- ✅ Formato JSON es válido

### Caso 2: Manejo de Datos Inválidos

**Objetivo:** Verificar robustez ante datos malformados

**Datos de Prueba:**
```json
// JSON inválido
{"temperature":"abc","humidity":null}

// Campos faltantes
{"temperature":25.0}

// Valores fuera de rango
{"temperature":-100,"humidity":150}
```

**Criterios de Éxito:**
- ✅ El servidor no se bloquea
- ✅ Se registran errores en logs
- ✅ Datos válidos se procesan normalmente

### Caso 3: Prueba de Carga

**Objetivo:** Verificar rendimiento con múltiples nodos

**Configuración:**
- 10 nodos simulados
- Envío cada 1 segundo
- Duración: 10 minutos

**Métricas a Monitorear:**
- Tiempo de respuesta del servidor
- Uso de memoria y CPU
- Latencia de WebSockets
- Integridad de datos en BD

### Caso 4: Recuperación ante Fallos

**Objetivo:** Verificar recuperación ante desconexiones

**Escenarios:**
1. Desconexión temporal de MQTT
2. Caída de base de datos
3. Reinicio del servidor
4. Pérdida de conexión WebSocket

**Criterios de Éxito:**
- ✅ Reconexión automática
- ✅ No pérdida de datos críticos
- ✅ Notificación de errores
- ✅ Recuperación sin intervención manual

---

## 📊 Checklist de Pruebas

### Preparación
- [ ] Servicios iniciados (Node.js, React, MySQL, MQTT)
- [ ] Variables de entorno configuradas
- [ ] Base de datos con datos de prueba
- [ ] Usuarios de prueba creados

### Conectividad
- [ ] Broker MQTT responde
- [ ] Autenticación MQTT funciona
- [ ] WebSockets se conectan
- [ ] API REST responde

### Funcionalidad
- [ ] Datos MQTT se reciben
- [ ] Datos se almacenan en BD
- [ ] Frontend muestra datos
- [ ] Alertas se generan
- [ ] Tiempo real funciona

### Robustez
- [ ] Manejo de errores
- [ ] Datos inválidos
- [ ] Reconexión automática
- [ ] Rendimiento aceptable

---

## 🔍 Solución de Problemas

### Problema: Datos no llegan al servidor

**Verificar:**
1. Broker MQTT está ejecutándose
2. Credenciales MQTT son correctas
3. Tópicos MQTT coinciden
4. Firewall no bloquea puerto 1883

### Problema: Datos no se almacenan

**Verificar:**
1. Conexión a base de datos
2. Permisos de usuario de BD
3. Estructura de tablas correcta
4. Logs de errores del servidor

### Problema: Frontend no se actualiza

**Verificar:**
1. WebSocket conectado
2. Token JWT válido
3. Eventos Socket.IO se emiten
4. Consola del navegador por errores

---

## 📈 Métricas de Rendimiento

### Objetivos de Rendimiento

- **Latencia MQTT → Servidor:** < 100ms
- **Latencia Servidor → BD:** < 50ms
- **Latencia Servidor → Frontend:** < 200ms
- **Throughput:** > 100 mensajes/segundo
- **Disponibilidad:** > 99.5%

### Monitoreo Continuo

```javascript
// Agregar métricas al servidor
const startTime = Date.now();

// Al procesar mensaje MQTT
const processingTime = Date.now() - startTime;
console.log(`Mensaje procesado en ${processingTime}ms`);

// Contador de mensajes
let messageCount = 0;
setInterval(() => {
  console.log(`Mensajes procesados en último minuto: ${messageCount}`);
  messageCount = 0;
}, 60000);
```

---

## 🚀 Ejecución Rápida de Pruebas

### Prueba Completa Automatizada

```bash
# 1. Instalar dependencias (si no están instaladas)
npm install

# 2. Verificar que todos los servicios estén ejecutándose
# - MySQL/MariaDB
# - Broker MQTT (Mosquitto)
# - Servidor Node.js (npm run dev)

# 3. Ejecutar verificación de salud
npm run test:health

# 4. Si todo está OK, ejecutar simulación de datos
npm run test:mqtt

# 5. Verificar en el frontend que los datos aparezcan
# Abrir http://localhost:3000 y observar actualizaciones
```

### Configuración Personalizada

Puedes modificar los parámetros de prueba editando `test-config.json`:

```json
{
  "mqtt": {
    "simulation": {
      "nodes": ["node1", "node2", "node3"],
      "intervalMs": 3000,
      "durationMs": 180000,
      "alertProbability": 0.15
    }
  }
}
```

### Interpretación de Resultados

**✅ Prueba Exitosa:**
- Todos los servicios responden
- Datos se almacenan correctamente
- Frontend se actualiza en tiempo real
- Alertas se generan apropiadamente

**❌ Prueba Fallida:**
- Revisar logs del servidor
- Verificar conectividad de servicios
- Comprobar configuración de variables de entorno
- Consultar sección de solución de problemas

---

## 🎯 Conclusión

Esta guía proporciona un marco completo para probar todos los aspectos del sistema SmartBee Mini. Los scripts automatizados facilitan la verificación regular del sistema.

### Beneficios de las Pruebas Automatizadas:

1. **Verificación rápida** del estado del sistema
2. **Detección temprana** de problemas
3. **Simulación realista** de datos de sensores
4. **Validación completa** del flujo de datos
5. **Pruebas de rendimiento** bajo carga

### Recomendaciones:

- **Ejecutar `npm run test:health`** antes de cada despliegue
- **Usar `npm run test:mqtt`** para probar nuevas funcionalidades
- **Monitorear métricas** de rendimiento regularmente
- **Documentar** cualquier problema encontrado
- **Mantener actualizados** los scripts de prueba

Recuerda que las pruebas automatizadas son una herramienta fundamental para mantener la calidad y confiabilidad del sistema SmartBee Mini en producción.