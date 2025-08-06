// Importación de librerías necesarias
const express = require('express');        // Framework web para Node.js
const cors = require('cors');              // Middleware para habilitar CORS (Cross-Origin Resource Sharing)
const http = require('http');              // Módulo HTTP nativo de Node.js
const socketIo = require('socket.io');     // Librería para comunicación en tiempo real WebSocket
const mqtt = require('mqtt');              // Cliente MQTT para comunicación IoT
require('dotenv').config();                // Carga variables de entorno desde archivo .env

// Conexión a la base de datos MySQL/MariaDB
const db = require('./config/database');

// Importación de rutas de la API REST
const authRoutes = require('./routes/auth');       // Rutas de autenticación (login, registro)
const userRoutes = require('./routes/users');      // Rutas de gestión de usuarios
const nodeRoutes = require('./routes/nodes');      // Rutas de gestión de nodos IoT
const dataRoutes = require('./routes/data');       // Rutas de datos de sensores
const alertRoutes = require('./routes/alerts');    // Rutas de alertas del sistema

// Creación de la aplicación Express
const app = express();
// Creación del servidor HTTP
const server = http.createServer(app);
// Configuración de Socket.IO para comunicación en tiempo real con el frontend
const io = socketIo(server, {
  cors: {
    origin: "*",                    // Permite conexiones desde cualquier origen
    methods: ["GET", "POST"]        // Métodos HTTP permitidos
  }
});

// Configuración de middlewares
app.use(cors());                          // Habilita CORS para todas las rutas
app.use(express.json());                  // Parser para JSON en el body de las peticiones
app.use(express.static('public'));        // Servir archivos estáticos desde la carpeta 'public'



// Configuración de rutas de la API REST
app.use('/api/auth', authRoutes);         // Rutas de autenticación (/api/auth/*)
app.use('/api/users', userRoutes);        // Rutas de usuarios (/api/users/*)
app.use('/api/nodes', nodeRoutes);        // Rutas de nodos IoT (/api/nodes/*)
app.use('/api/data', dataRoutes);         // Rutas de datos de sensores (/api/data/*)
app.use('/api/alerts', alertRoutes);      // Rutas de alertas (/api/alerts/*)

// Cliente MQTT para recibir datos de sensores IoT
// Conecta al broker MQTT configurado en las variables de entorno
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

// Evento que se ejecuta cuando se establece la conexión con el broker MQTT
mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  // Suscripción al tópico de datos de sensores (smartbee/[nodo_id]/data)
  // El '+' es un wildcard que permite recibir datos de cualquier nodo
  mqttClient.subscribe('smartbee/+/data', (err) => {
    if (err) {
      console.error('Error suscribiéndose al tópico MQTT:', err);
    } else {
      console.log('Suscrito a tópicos de datos de sensores');
    }
  });
});

// Evento que se ejecuta cuando se recibe un mensaje MQTT
mqttClient.on('message', async (topic, message) => {
  try {
    // Parsear el mensaje JSON recibido del sensor
    const data = JSON.parse(message.toString());
    // Extraer el ID del nodo desde el tópico (smartbee/[nodo_id]/data)
    const nodeId = topic.split('/')[1];
    
    // Almacenar los datos del sensor en la base de datos
    await db.execute(
      'INSERT INTO nodo_mensaje (nodo_id, topico, payload, fecha) VALUES (?, ?, ?, ?)',
      [nodeId, topic, JSON.stringify(data), new Date()]
    );
    
    console.log(`Datos recibidos del nodo ${nodeId}:`, data);
    
    // Verificar si hay condiciones de alerta
    if (data.status === 'alert') {
      console.log(`🚨 ALERTA detectada en nodo ${nodeId}`);
      
      // Determinar el tipo de alerta basado en los valores
      let alertType = '';
      let alertMessage = '';
      
      // Verificar temperatura
      if (data.temperature > 37) {
        alertType = 'TEMP_ALTA';
        alertMessage = `Temperatura alta detectada: ${data.temperature}°C`;
      } else if (data.temperature < 15) {
        alertType = 'TEMP_BAJA';
        alertMessage = `Temperatura baja detectada: ${data.temperature}°C`;
      }
      // Verificar humedad
      else if (data.humidity > 80) {
        alertType = 'HUM_ALTA';
        alertMessage = `Humedad alta detectada: ${data.humidity}%`;
      } else if (data.humidity < 30) {
        alertType = 'HUM_BAJA';
        alertMessage = `Humedad baja detectada: ${data.humidity}%`;
      }
      // Verificar peso
      else if (data.weight < 30) {
        alertType = 'PESO_BAJO';
        alertMessage = `Peso bajo detectado: ${data.weight}kg`;
      }
      
      // Si se detectó una alerta, emitirla a los clientes
      if (alertType) {
        const alertData = {
          nodeId,
          type: alertType,
          message: alertMessage,
          value: data[alertType.split('_')[0].toLowerCase()],
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        console.log(`Emitiendo alerta: ${alertType} - ${alertMessage}`);
        io.emit('newAlert', alertData);
      }
    }
    
    // Enviar datos en tiempo real a todos los clientes conectados via WebSocket
    io.emit('sensorData', { nodeId, ...data });
  } catch (error) {
    console.error('Error procesando mensaje MQTT:', error);
  }
});

// Manejo de conexiones WebSocket con Socket.IO
// Permite comunicación en tiempo real entre el servidor y el frontend
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Evento que se ejecuta cuando un cliente se desconecta
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Servir la aplicación React en producción
// En modo producción, sirve los archivos estáticos del build de React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  // Ruta catch-all: redirige todas las rutas no encontradas al index.html de React
  // Esto permite que React Router maneje el enrutamiento del lado del cliente
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Configuración del puerto del servidor
const PORT = process.env.PORT || 5000;
// Iniciar el servidor HTTP con Socket.IO
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});