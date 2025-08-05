-- =====================================================
-- SmartBee Mini - Esquema de Base de Datos
-- Sistema de Monitoreo de Colmenas con Sensores IoT
-- =====================================================
-- Este archivo contiene la estructura completa de la base de datos
-- para el sistema SmartBee Mini, incluyendo todas las tablas necesarias
-- para gestionar usuarios, nodos IoT, sensores, alertas y datos de colmenas

-- Eliminar tablas existentes en orden correcto (respetando dependencias)
DROP TABLE IF EXISTS nodo_alerta;     -- Alertas generadas por nodos
DROP TABLE IF EXISTS alerta;          -- Tipos de alertas del sistema
DROP TABLE IF EXISTS nodo_mensaje;    -- Mensajes/datos recibidos de sensores
DROP TABLE IF EXISTS nodo_ubicacion;  -- Ubicaciones geográficas de nodos
DROP TABLE IF EXISTS nodo_colmena;    -- Relación entre nodos y colmenas
DROP TABLE IF EXISTS colmena;         -- Información de colmenas
DROP TABLE IF EXISTS usuario;         -- Usuarios del sistema
DROP TABLE IF EXISTS rol;             -- Roles de usuario (admin, apicultor)
DROP TABLE IF EXISTS nodo;            -- Nodos IoT/sensores
DROP TABLE IF EXISTS nodo_tipo;       -- Tipos de nodos disponibles

-- =====================================================
-- TABLAS DE CONFIGURACIÓN Y CATÁLOGOS
-- =====================================================

-- Tabla de tipos de nodo IoT
-- Define los diferentes tipos de sensores/nodos disponibles en el sistema
CREATE TABLE `nodo_tipo` (
  `tipo` varchar(12) NOT NULL,           -- Código del tipo (ej: 'SENSOR_01', 'BASCULA')
  `descripcion` varchar(64) NOT NULL,    -- Descripción del tipo de nodo
  PRIMARY KEY (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de roles de usuario
-- Define los diferentes niveles de acceso en el sistema
CREATE TABLE `rol` (
  `rol` varchar(12) NOT NULL,            -- Código del rol ('admin', 'apicultor')
  `descripcion` varchar(64) NOT NULL,    -- Descripción del rol
  PRIMARY KEY (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de tipos de alertas
-- Define los diferentes tipos de alertas que puede generar el sistema
CREATE TABLE `alerta` (
  `id` varchar(12) NOT NULL,             -- Código único de la alerta
  `nombre` varchar(100) NOT NULL,        -- Nombre descriptivo de la alerta
  `indicador` varchar(64) NOT NULL,      -- Indicador o métrica que dispara la alerta
  `descripcion` varchar(256) NOT NULL,   -- Descripción detallada de la alerta
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- =====================================================
-- TABLAS PRINCIPALES DEL SISTEMA
-- =====================================================

-- Tabla de nodos IoT/sensores
-- Almacena información de todos los dispositivos IoT conectados al sistema
CREATE TABLE `nodo` (
  `id` varchar(64) NOT NULL,             -- Identificador único del nodo (ej: MAC address)
  `descripcion` varchar(1024) NOT NULL,  -- Descripción del nodo y su ubicación
  `tipo` varchar(12) NOT NULL,           -- Tipo de nodo (referencia a nodo_tipo)
  `activo` TINYINT(1) NOT NULL DEFAULT 1, -- Estado del nodo (1=activo, 0=inactivo)
  PRIMARY KEY (`id`),
  KEY `nodo_FK` (`tipo`),
  CONSTRAINT `nodo_FK` FOREIGN KEY (`tipo`) REFERENCES `nodo_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de usuarios del sistema
-- Almacena información de administradores y apicultores
CREATE TABLE `usuario` (
  `id` varchar(16) NOT NULL,             -- Identificador único del usuario
  `clave` varchar(64) NOT NULL,          -- Contraseña encriptada con bcrypt
  `nombre` varchar(100) NOT NULL,        -- Nombre del usuario
  `apellido` varchar(100) NOT NULL,      -- Apellido del usuario
  `rol` varchar(12) DEFAULT NULL,        -- Rol del usuario (admin/apicultor)
  `activo` TINYINT(1) NOT NULL DEFAULT 1, -- Estado del usuario (1=activo, 0=inactivo)
  PRIMARY KEY (`id`),
  KEY `usuario_FK` (`rol`),
  CONSTRAINT `usuario_FK` FOREIGN KEY (`rol`) REFERENCES `rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de colmenas
-- Almacena información de las colmenas gestionadas por los apicultores
CREATE TABLE `colmena` (
  `id` varchar(64) NOT NULL,             -- Identificador único de la colmena
  `descripcion` varchar(1024) NOT NULL,  -- Descripción de la colmena
  `dueno` varchar(16) NOT NULL,          -- ID del apicultor propietario
  `activo` TINYINT(1) NOT NULL DEFAULT 1, -- Estado de la colmena (1=activa, 0=inactiva)
  PRIMARY KEY (`id`),
  KEY `colmena_FK` (`dueno`),
  CONSTRAINT `colmena_FK` FOREIGN KEY (`dueno`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- =====================================================
-- TABLAS DE DATOS Y EVENTOS
-- =====================================================

-- Tabla de alertas generadas por nodos
-- Registra todas las alertas que se disparan en el sistema
CREATE TABLE `nodo_alerta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT, -- ID único de la alerta generada
  `nodo_id` varchar(64) NOT NULL,                -- ID del nodo que generó la alerta
  `alerta_id` varchar(12) NOT NULL,              -- Tipo de alerta generada
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3), -- Fecha y hora de la alerta
  PRIMARY KEY (`id`),
  KEY `nodo_alerta_FK` (`nodo_id`),
  KEY `nodo_alerta_alerta_id_IDX` (`alerta_id`) USING BTREE,
  KEY `nodo_alerta_fecha_IDX` (`fecha`) USING BTREE, -- Índice para consultas por fecha
  CONSTRAINT `nodo_alerta_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`),
  CONSTRAINT `nodo_alerta_alerta_FK` FOREIGN KEY (`alerta_id`) REFERENCES `alerta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de mensajes de nodos (datos de sensores)
-- Almacena todos los datos recibidos de los sensores IoT via MQTT
CREATE TABLE `nodo_mensaje` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,  -- ID único del mensaje
  `nodo_id` varchar(64) NOT NULL,                 -- ID del nodo que envió el mensaje
  `topico` varchar(255) NOT NULL,                 -- Tópico MQTT del mensaje
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)), -- Datos del sensor en formato JSON
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3), -- Fecha y hora de recepción
  PRIMARY KEY (`id`),
  KEY `mensaje_FK` (`nodo_id`),
  KEY `mensaje_fecha_IDX` (`fecha`) USING BTREE,  -- Índice para consultas por fecha
  CONSTRAINT `mensaje_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de ubicaciones geográficas de nodos
-- Permite rastrear la ubicación física de cada nodo IoT
CREATE TABLE `nodo_ubicacion` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,  -- ID único de la ubicación
  `nodo_id` varchar(64) NOT NULL,                 -- ID del nodo
  `latitud` decimal(10,7) NOT NULL,               -- Coordenada de latitud (GPS)
  `longitud` decimal(10,7) NOT NULL,              -- Coordenada de longitud (GPS)
  `descripcion` varchar(255) NOT NULL,            -- Descripción de la ubicación
  `comuna` varchar(100) NOT NULL,                 -- Comuna donde se encuentra el nodo
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3), -- Fecha de registro de la ubicación
  `activo` TINYINT(1) NOT NULL DEFAULT 1,         -- Estado de la ubicación (1=activa, 0=inactiva)
  PRIMARY KEY (`id`),
  KEY `nodo_ubicacion_FK` (`nodo_id`),
  KEY `nodo_ubicacion_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `nodo_ubicacion_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- =====================================================
-- TABLAS DE RELACIONES
-- =====================================================

-- Tabla de relación nodo-colmena
-- Establece qué nodos están monitoreando cada colmena
CREATE TABLE `nodo_colmena` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,  -- ID único de la relación
  `colmena_id` varchar(64) NOT NULL,              -- ID de la colmena
  `nodo_id` varchar(64) NOT NULL,                 -- ID del nodo que monitorea la colmena
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3), -- Fecha de asignación
  PRIMARY KEY (`id`),
  KEY `nodo_colmena_FK` (`nodo_id`),
  KEY `nodo_colmena_FK_1` (`colmena_id`),
  KEY `nodo_colmena_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `nodo_colmena_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`),
  CONSTRAINT `nodo_colmena_FK_1` FOREIGN KEY (`colmena_id`) REFERENCES `colmena` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- =====================================================
-- NOTAS SOBRE EL ESQUEMA:
-- =====================================================
-- 1. Todas las tablas usan utf8mb4_spanish_ci para soporte completo de caracteres españoles
-- 2. Los timestamps incluyen milisegundos (3) para mayor precisión
-- 3. Los índices están optimizados para consultas frecuentes por fecha
-- 4. Las claves foráneas mantienen la integridad referencial
-- 5. El campo 'payload' en nodo_mensaje valida que sea JSON válido