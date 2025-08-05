const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
require('dotenv').config();

// Database connection
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const nodeRoutes = require('./routes/nodes');
const dataRoutes = require('./routes/data');
const alertRoutes = require('./routes/alerts');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/alerts', alertRoutes);

// MQTT Client for receiving sensor data
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  mqttClient.subscribe('smartbee/+/data', (err) => {
    if (err) {
      console.error('Error suscribiéndose al tópico MQTT:', err);
    } else {
      console.log('Suscrito a tópicos de datos de sensores');
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const nodeId = topic.split('/')[1];
    
    // Store data in database
    await db.execute(
      'INSERT INTO datos_sensor (nodo_id, temperatura, humedad, peso, timestamp) VALUES (?, ?, ?, ?, ?)',
      [nodeId, data.temperatura, data.humedad, data.peso, new Date()]
    );
    
    // Emit real-time data to connected clients
    io.emit('sensorData', { nodeId, ...data });
    
    console.log(`Datos recibidos del nodo ${nodeId}:`, data);
  } catch (error) {
    console.error('Error procesando mensaje MQTT:', error);
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});