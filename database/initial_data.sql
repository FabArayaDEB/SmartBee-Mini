-- SmartBee Mini - Datos iniciales
-- Datos de prueba para visualización en la aplicación web

-- Insertar tipos de nodo
INSERT INTO `nodo_tipo` (`tipo`, `descripcion`) VALUES
('ambiental', 'Nodo sensor ambiental'),
('colmena', 'Nodo sensor de colmena');

-- Insertar roles
INSERT INTO `rol` (`rol`, `descripcion`) VALUES
('admin', 'Administrador del sistema'),
('apicultor', 'Apicultor usuario del sistema');

-- Insertar tipos de alertas
INSERT INTO `alerta` (`id`, `nombre`, `indicador`, `descripcion`) VALUES
('TEMP_HIGH', 'Temperatura Alta', 'temperature', 'Temperatura por encima del rango normal'),
('TEMP_LOW', 'Temperatura Baja', 'temperature', 'Temperatura por debajo del rango normal'),
('TEMP_CRIT', 'Temperatura Crítica', 'temperature', 'Temperatura en nivel crítico'),
('HUM_HIGH', 'Humedad Alta', 'humidity', 'Humedad por encima del rango normal'),
('HUM_LOW', 'Humedad Baja', 'humidity', 'Humedad por debajo del rango normal'),
('HUM_CRIT', 'Humedad Crítica', 'humidity', 'Humedad en nivel crítico'),
('BATT_LOW', 'Batería Baja', 'battery', 'Nivel de batería bajo'),
('BATT_CRIT', 'Batería Crítica', 'battery', 'Nivel de batería crítico'),
('SIGNAL_WEAK', 'Señal Débil', 'signal', 'Señal de comunicación débil'),
('NODE_OFF', 'Nodo Desconectado', 'connection', 'Nodo sin comunicación'),
('WEIGHT_CHG', 'Cambio de Peso', 'weight', 'Cambio significativo en el peso de la colmena');

-- Insertar usuarios (contraseñas hasheadas con bcrypt)
-- Contraseña para admin: admin123
-- Contraseña para apicultor: apicultor123
INSERT INTO `usuario` (`id`, `clave`, `nombre`, `apellido`, `rol`, `activo`) VALUES
('admin', '$2a$10$lsSgspKACZhJgHN3oSXwPeizFHBOe07AionM0ZSqc50bXXBZvB9Ze', 'Administrador', 'Sistema', 'admin', 1),
('apicultor1', '$2a$10$XJiKMj.1n1Xzky72SHWz6OvYuREPIVlM6MrvkMtyxhpmMaZ.Z/Y.O', 'Juan', 'Pérez', 'apicultor', 1),
('apicultor2', '$2a$10$XJiKMj.1n1Xzky72SHWz6OvYuREPIVlM6MrvkMtyxhpmMaZ.Z/Y.O', 'María', 'González', 'apicultor', 1);

-- Insertar nodos de prueba
INSERT INTO `nodo` (`id`, `descripcion`, `tipo`, `activo`) VALUES
('ENV001', 'Sensor ambiental - Entrada del apiario', 'ambiental', 1),
('ENV002', 'Sensor ambiental - Centro del apiario', 'ambiental', 1),
('BEE001', 'Sensor de colmena - Colmena #1', 'colmena', 1),
('BEE002', 'Sensor de colmena - Colmena #2', 'colmena', 1),
('BEE003', 'Sensor de colmena - Colmena #3', 'colmena', 1);

-- Insertar colmenas
INSERT INTO `colmena` (`id`, `descripcion`, `dueno`, `activo`) VALUES
('COL001', 'Colmena productiva #1 - Reina joven', 'apicultor1', 1),
('COL002', 'Colmena productiva #2 - Reina de 2 años', 'apicultor1', 1),
('COL003', 'Colmena nueva #3 - Núcleo reciente', 'apicultor2', 1);

-- Insertar ubicaciones de nodos
INSERT INTO `nodo_ubicacion` (`nodo_id`, `latitud`, `longitud`, `descripcion`, `comuna`, `activo`) VALUES
('ENV001', -33.4489, -70.6693, 'Entrada principal del apiario', 'Santiago', 1),
('ENV002', -33.4495, -70.6688, 'Centro del apiario', 'Santiago', 1),
('BEE001', -33.4492, -70.6690, 'Sector A - Fila 1', 'Santiago', 1),
('BEE002', -33.4493, -70.6689, 'Sector A - Fila 2', 'Santiago', 1),
('BEE003', -33.4494, -70.6687, 'Sector B - Fila 1', 'Santiago', 1);

-- Insertar relaciones nodo-colmena
INSERT INTO `nodo_colmena` (`colmena_id`, `nodo_id`) VALUES
('COL001', 'BEE001'),
('COL002', 'BEE002'),
('COL003', 'BEE003');

-- Insertar datos de sensores históricos (últimas 24 horas)
INSERT INTO `nodo_mensaje` (`nodo_id`, `topico`, `payload`, `fecha`) VALUES
-- Datos de ENV001 (cada 30 minutos)
('ENV001', 'smartbee/nodes/ENV001/data', '{"nodeId":"ENV001","timestamp":"2024-01-15T08:00:00.000Z","temperature":18.5,"humidity":72.3,"battery":85,"signal":-65}', '2024-01-15 08:00:00'),
('ENV001', 'smartbee/nodes/ENV001/data', '{"nodeId":"ENV001","timestamp":"2024-01-15T08:30:00.000Z","temperature":19.2,"humidity":70.1,"battery":84,"signal":-66}', '2024-01-15 08:30:00'),
('ENV001', 'smartbee/nodes/ENV001/data', '{"nodeId":"ENV001","timestamp":"2024-01-15T09:00:00.000Z","temperature":20.8,"humidity":68.5,"battery":84,"signal":-64}', '2024-01-15 09:00:00'),
('ENV001', 'smartbee/nodes/ENV001/data', '{"nodeId":"ENV001","timestamp":"2024-01-15T09:30:00.000Z","temperature":22.1,"humidity":66.2,"battery":83,"signal":-65}', '2024-01-15 09:30:00'),
('ENV001', 'smartbee/nodes/ENV001/data', '{"nodeId":"ENV001","timestamp":"2024-01-15T10:00:00.000Z","temperature":23.5,"humidity":64.8,"battery":83,"signal":-63}', '2024-01-15 10:00:00'),

-- Datos de BEE001 (cada 15 minutos)
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T08:00:00.000Z","temperature":34.8,"humidity":58.2,"weight":45.8,"battery":92,"signal":-62}', '2024-01-15 08:00:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T08:15:00.000Z","temperature":35.1,"humidity":57.9,"weight":45.8,"battery":92,"signal":-61}', '2024-01-15 08:15:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T08:30:00.000Z","temperature":35.3,"humidity":57.5,"weight":45.9,"battery":91,"signal":-62}', '2024-01-15 08:30:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T08:45:00.000Z","temperature":35.5,"humidity":57.2,"weight":45.9,"battery":91,"signal":-63}', '2024-01-15 08:45:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T09:00:00.000Z","temperature":35.7,"humidity":56.8,"weight":46.0,"battery":91,"signal":-62}', '2024-01-15 09:00:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T09:15:00.000Z","temperature":35.9,"humidity":56.5,"weight":46.0,"battery":90,"signal":-61}', '2024-01-15 09:15:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T09:30:00.000Z","temperature":36.1,"humidity":56.2,"weight":46.1,"battery":90,"signal":-62}', '2024-01-15 09:30:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T09:45:00.000Z","temperature":36.2,"humidity":55.9,"weight":46.1,"battery":90,"signal":-63}', '2024-01-15 09:45:00'),
('BEE001', 'smartbee/nodes/BEE001/data', '{"nodeId":"BEE001","timestamp":"2024-01-15T10:00:00.000Z","temperature":36.0,"humidity":56.1,"weight":46.2,"battery":89,"signal":-62}', '2024-01-15 10:00:00'),

-- Datos de BEE002
('BEE002', 'smartbee/nodes/BEE002/data', '{"nodeId":"BEE002","timestamp":"2024-01-15T08:00:00.000Z","temperature":34.5,"humidity":60.1,"weight":52.3,"battery":88,"signal":-64}', '2024-01-15 08:00:00'),
('BEE002', 'smartbee/nodes/BEE002/data', '{"nodeId":"BEE002","timestamp":"2024-01-15T09:00:00.000Z","temperature":35.2,"humidity":59.5,"weight":52.4,"battery":87,"signal":-65}', '2024-01-15 09:00:00'),
('BEE002', 'smartbee/nodes/BEE002/data', '{"nodeId":"BEE002","timestamp":"2024-01-15T10:00:00.000Z","temperature":35.8,"humidity":58.9,"weight":52.5,"battery":87,"signal":-64}', '2024-01-15 10:00:00'),

-- Datos de BEE003
('BEE003', 'smartbee/nodes/BEE003/data', '{"nodeId":"BEE003","timestamp":"2024-01-15T08:00:00.000Z","temperature":35.5,"humidity":57.9,"weight":38.2,"battery":81,"signal":-70}', '2024-01-15 08:00:00'),
('BEE003', 'smartbee/nodes/BEE003/data', '{"nodeId":"BEE003","timestamp":"2024-01-15T09:00:00.000Z","temperature":36.1,"humidity":57.2,"weight":38.3,"battery":80,"signal":-71}', '2024-01-15 09:00:00'),
('BEE003', 'smartbee/nodes/BEE003/data', '{"nodeId":"BEE003","timestamp":"2024-01-15T10:00:00.000Z","temperature":36.3,"humidity":56.8,"weight":38.4,"battery":79,"signal":-72}', '2024-01-15 10:00:00'),

-- Datos de ENV002
('ENV002', 'smartbee/nodes/ENV002/data', '{"nodeId":"ENV002","timestamp":"2024-01-15T08:00:00.000Z","temperature":19.1,"humidity":68.8,"battery":78,"signal":-68}', '2024-01-15 08:00:00'),
('ENV002', 'smartbee/nodes/ENV002/data', '{"nodeId":"ENV002","timestamp":"2024-01-15T09:00:00.000Z","temperature":21.5,"humidity":65.2,"battery":77,"signal":-69}', '2024-01-15 09:00:00'),
('ENV002', 'smartbee/nodes/ENV002/data', '{"nodeId":"ENV002","timestamp":"2024-01-15T10:00:00.000Z","temperature":23.8,"humidity":62.5,"battery":77,"signal":-68}', '2024-01-15 10:00:00');

-- Insertar algunas alertas de ejemplo
INSERT INTO `nodo_alerta` (`nodo_id`, `alerta_id`, `fecha`) VALUES
('BEE003', 'BATT_LOW', '2024-01-15 09:30:00'),
('ENV002', 'SIGNAL_WEAK', '2024-01-15 08:45:00'),
('BEE003', 'SIGNAL_WEAK', '2024-01-15 10:00:00');