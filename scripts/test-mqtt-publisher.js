// Script de simulación MQTT para SmartBee Mini
// Simula múltiples nodos IoT enviando datos de sensores

const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// Configuración del broker MQTT
const MQTT_CONFIG = {
    host: 'test.mosquitto.org',
    port: 1883,
    username: '',
    password: ''
};

// Configuración de la simulación
const SIMULATION_CONFIG = {
    nodes: 3,
    interval: 5000, // 5 segundos entre mensajes
    duration: 60000, // 1 minuto de simulación
    alertProbability: 0.1 // 10% probabilidad de alerta
};

const nodes = ['ENV001', 'BEE001', 'BEE002'];

// Rangos de sensores normales
const SENSOR_RANGES = {
    normal: {
        temperature: { min: 20, max: 35 },
        humidity: { min: 40, max: 70 },
        weight: { min: 45, max: 55 },
        sound: { min: 30, max: 60 }
    },
    alert: {
        temperature: { min: 5, max: 45 },
        humidity: { min: 10, max: 90 },
        weight: { min: 20, max: 80 },
        sound: { min: 70, max: 100 }
    }
};

class MQTTSimulator {
    constructor() {
        this.client = null;
        this.intervals = [];
        this.isConnected = false;
    }

    // Conectar al broker MQTT
    async connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Conectando al broker MQTT...');
            
            this.client = mqtt.connect(`mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`, {
                username: MQTT_CONFIG.username,
                password: MQTT_CONFIG.password,
                connectTimeout: 5000
            });

            this.client.on('connect', () => {
                console.log('✅ Conectado al broker MQTT');
                this.isConnected = true;
                resolve();
            });

            this.client.on('error', (error) => {
                console.error('❌ Error de conexión MQTT:', error.message);
                reject(error);
            });

            this.client.on('close', () => {
                console.log('🔌 Conexión MQTT cerrada');
                this.isConnected = false;
            });
        });
    }

    // Generar datos de sensor aleatorios
    generateSensorData(nodeId, isAlert = false) {
        const ranges = isAlert ? SENSOR_RANGES.alert : SENSOR_RANGES.normal;
        
        const data = {
            nodeId: nodes[nodeId - 1] || `NODE_${nodeId.toString().padStart(3, '0')}`,
            timestamp: new Date().toISOString(),
            temperatura: this.randomInRange(ranges.temperature),
            humedad: this.randomInRange(ranges.humidity),
            peso: this.randomInRange(ranges.weight),
            sonido: this.randomInRange(ranges.sound),
            battery: this.randomInRange({ min: 20, max: 100 }),
            signal: this.randomInRange({ min: -80, max: -30 }),
            status: isAlert ? 'alert' : 'normal'
        };

        return data;
    }

    // Generar número aleatorio en rango
    randomInRange(range) {
        return Math.round((Math.random() * (range.max - range.min) + range.min) * 100) / 100;
    }

    // Publicar datos de un nodo
    publishNodeData(nodeId) {
        if (!this.isConnected) {
            console.log('⚠️ No conectado al broker MQTT');
            return;
        }

        const isAlert = Math.random() < SIMULATION_CONFIG.alertProbability;
        const data = this.generateSensorData(nodeId, isAlert);
        const topic = `smartbee/${data.nodeId}/data`;
        
        this.client.publish(topic, JSON.stringify(data), (error) => {
            if (error) {
                console.error(`❌ Error publicando datos del nodo ${nodeId}:`, error);
            } else {
                const status = isAlert ? '🚨 ALERTA' : '📊 NORMAL';
                console.log(`${status} - Nodo ${data.nodeId}: T=${data.temperatura}°C, H=${data.humedad}%, W=${data.peso}kg`);
            }
        });
    }

    // Iniciar simulación
    startSimulation() {
        console.log(`🚀 Iniciando simulación con ${SIMULATION_CONFIG.nodes} nodos...`);
        console.log(`⏱️ Intervalo: ${SIMULATION_CONFIG.interval}ms, Duración: ${SIMULATION_CONFIG.duration}ms`);
        console.log('📡 Publicando datos...');
        console.log('---');

        // Crear intervalos para cada nodo
        for (let i = 1; i <= SIMULATION_CONFIG.nodes; i++) {
            const interval = setInterval(() => {
                this.publishNodeData(i);
            }, SIMULATION_CONFIG.interval);
            
            this.intervals.push(interval);
        }

        // Detener simulación después del tiempo configurado
        setTimeout(() => {
            this.stopSimulation();
        }, SIMULATION_CONFIG.duration);
    }

    // Detener simulación
    stopSimulation() {
        console.log('---');
        console.log('⏹️ Deteniendo simulación...');
        
        // Limpiar intervalos
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        // Cerrar conexión MQTT
        if (this.client) {
            this.client.end();
        }
        
        console.log('✅ Simulación completada');
        process.exit(0);
    }
}

// Función principal
async function main() {
    const simulator = new MQTTSimulator();
    
    try {
        await simulator.connect();
        simulator.startSimulation();
    } catch (error) {
        console.error('❌ Error en la simulación:', error.message);
        console.log('💡 Asegúrate de que el broker MQTT esté ejecutándose');
        process.exit(1);
    }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\n🛑 Simulación interrumpida por el usuario');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Simulación terminada');
    process.exit(0);
});

// Ejecutar simulación
if (require.main === module) {
    main();
}

module.exports = MQTTSimulator;