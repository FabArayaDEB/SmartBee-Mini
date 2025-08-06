// Script para simular datos de sensores MQTT
const mqtt = require('mqtt');

// Conectar al broker MQTT
const client = mqtt.connect('mqtt://localhost:1883');

// Datos de ejemplo para un nodo
const nodeId = 'BEE001'; // ID de nodo que existe en la base de datos

// Función para generar datos aleatorios de sensores
function generateRandomData(generateAlert = false) {
  if (generateAlert) {
    // Generar datos que activen alertas
    const alertType = Math.floor(Math.random() * 4); // 0: temperatura alta, 1: temperatura baja, 2: humedad alta, 3: humedad baja, 4: peso bajo
    
    switch (alertType) {
      case 0: // Temperatura alta
        return {
          nodeId: nodeId,
          temperature: parseFloat((38 + Math.random() * 7).toFixed(1)),  // Temperatura muy alta (38-45°C)
          humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
          weight: parseFloat((10 + Math.random() * 5).toFixed(2)),
          battery: parseInt((70 + Math.random() * 30).toFixed(0)),
          timestamp: new Date().toISOString(),
          status: 'alert'
        };
      case 1: // Temperatura baja
        return {
          nodeId: nodeId,
          temperature: parseFloat((5 + Math.random() * 7).toFixed(1)),  // Temperatura muy baja (5-12°C)
          humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
          weight: parseFloat((10 + Math.random() * 5).toFixed(2)),
          battery: parseInt((70 + Math.random() * 30).toFixed(0)),
          timestamp: new Date().toISOString(),
          status: 'alert'
        };
      case 2: // Humedad alta
        return {
          nodeId: nodeId,
          temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
          humidity: parseFloat((85 + Math.random() * 15).toFixed(1)),  // Humedad muy alta (85-100%)
          weight: parseFloat((10 + Math.random() * 5).toFixed(2)),
          battery: parseInt((70 + Math.random() * 30).toFixed(0)),
          timestamp: new Date().toISOString(),
          status: 'alert'
        };
      case 3: // Humedad baja
        return {
          nodeId: nodeId,
          temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
          humidity: parseFloat((10 + Math.random() * 15).toFixed(1)),  // Humedad muy baja (10-25%)
          weight: parseFloat((10 + Math.random() * 5).toFixed(2)),
          battery: parseInt((70 + Math.random() * 30).toFixed(0)),
          timestamp: new Date().toISOString(),
          status: 'alert'
        };
      default: // Peso bajo
        return {
          nodeId: nodeId,
          temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
          humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),
          weight: parseFloat((3 + Math.random() * 4).toFixed(2)),  // Peso muy bajo (3-7kg)
          battery: parseInt((70 + Math.random() * 30).toFixed(0)),
          timestamp: new Date().toISOString(),
          status: 'alert'
        };
    }
  } else {
    // Datos normales
    return {
      nodeId: nodeId,
      temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),  // Temperatura entre 20-30°C
      humidity: parseFloat((50 + Math.random() * 30).toFixed(1)),     // Humedad entre 50-80%
      weight: parseFloat((10 + Math.random() * 5).toFixed(2)),        // Peso entre 10-15kg
      battery: parseInt((70 + Math.random() * 30).toFixed(0)),        // Batería entre 70-100%
      timestamp: new Date().toISOString(),
      status: 'normal'
    };
  }
}

// Cuando se conecte al broker MQTT
client.on('connect', () => {
  console.log('Conectado al broker MQTT');
  
  // Variable para alternar entre datos normales y alertas
  let alertCounter = 0;
  
  // Enviar datos cada 5 segundos
  setInterval(() => {
    // Generar una alerta cada 4 ciclos (aproximadamente cada 20 segundos)
    const shouldGenerateAlert = alertCounter % 4 === 0 && alertCounter > 0;
    
    const data = generateRandomData(shouldGenerateAlert);
    const topic = `smartbee/${nodeId}/data`;
    
    // Mostrar mensaje especial si es una alerta
    if (shouldGenerateAlert) {
      console.log(`🚨 ALERTA - Enviando datos anómalos al tópico ${topic}:`, data);
    } else {
      console.log(`Enviando datos normales al tópico ${topic}:`, data);
    }
    
    client.publish(topic, JSON.stringify(data));
    
    // Incrementar contador
    alertCounter++;
  }, 5000);
});

// Manejar errores
client.on('error', (err) => {
  console.error('Error en la conexión MQTT:', err);
});

console.log('Iniciando simulador de datos MQTT...');