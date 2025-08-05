-- SmartBee Mini Database Schema
-- Estructura de base de datos local para visualización web

DROP TABLE IF EXISTS nodo_alerta;
DROP TABLE IF EXISTS alerta;
DROP TABLE IF EXISTS nodo_mensaje;
DROP TABLE IF EXISTS nodo_ubicacion;
DROP TABLE IF EXISTS nodo_colmena;
DROP TABLE IF EXISTS colmena;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS rol;
DROP TABLE IF EXISTS nodo;
DROP TABLE IF EXISTS nodo_tipo;

-- Tabla de tipos de nodo
CREATE TABLE `nodo_tipo` (
  `tipo` varchar(12) NOT NULL,
  `descripcion` varchar(64) NOT NULL,
  PRIMARY KEY (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de roles de usuario
CREATE TABLE `rol` (
  `rol` varchar(12) NOT NULL,
  `descripcion` varchar(64) NOT NULL,
  PRIMARY KEY (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de alertas
CREATE TABLE `alerta` (
  `id` varchar(12) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `indicador` varchar(64) NOT NULL,
  `descripcion` varchar(256) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de nodos
CREATE TABLE `nodo` (
  `id` varchar(64) NOT NULL,
  `descripcion` varchar(1024) NOT NULL,
  `tipo` varchar(12) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `nodo_FK` (`tipo`),
  CONSTRAINT `nodo_FK` FOREIGN KEY (`tipo`) REFERENCES `nodo_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de usuarios
CREATE TABLE `usuario` (
  `id` varchar(16) NOT NULL,
  `clave` varchar(64) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `rol` varchar(12) DEFAULT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `usuario_FK` (`rol`),
  CONSTRAINT `usuario_FK` FOREIGN KEY (`rol`) REFERENCES `rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de colmenas
CREATE TABLE `colmena` (
  `id` varchar(64) NOT NULL,
  `descripcion` varchar(1024) NOT NULL,
  `dueno` varchar(16) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `colmena_FK` (`dueno`),
  CONSTRAINT `colmena_FK` FOREIGN KEY (`dueno`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de alertas por nodo
CREATE TABLE `nodo_alerta` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nodo_id` varchar(64) NOT NULL,
  `alerta_id` varchar(12) NOT NULL,
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `nodo_alerta_FK` (`nodo_id`),
  KEY `nodo_alerta_alerta_id_IDX` (`alerta_id`) USING BTREE,
  KEY `nodo_alerta_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `nodo_alerta_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`),
  CONSTRAINT `nodo_alerta_alerta_FK` FOREIGN KEY (`alerta_id`) REFERENCES `alerta` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de mensajes de nodos (datos de sensores)
CREATE TABLE `nodo_mensaje` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nodo_id` varchar(64) NOT NULL,
  `topico` varchar(255) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `mensaje_FK` (`nodo_id`),
  KEY `mensaje_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `mensaje_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de ubicaciones de nodos
CREATE TABLE `nodo_ubicacion` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nodo_id` varchar(64) NOT NULL,
  `latitud` decimal(10,7) NOT NULL,
  `longitud` decimal(10,7) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `comuna` varchar(100) NOT NULL,
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `nodo_ubicacion_FK` (`nodo_id`),
  KEY `nodo_ubicacion_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `nodo_ubicacion_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Tabla de relación nodo-colmena
CREATE TABLE `nodo_colmena` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `colmena_id` varchar(64) NOT NULL,
  `nodo_id` varchar(64) NOT NULL,
  `fecha` timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `nodo_colmena_FK` (`nodo_id`),
  KEY `nodo_colmena_FK_1` (`colmena_id`),
  KEY `nodo_colmena_fecha_IDX` (`fecha`) USING BTREE,
  CONSTRAINT `nodo_colmena_FK` FOREIGN KEY (`nodo_id`) REFERENCES `nodo` (`id`),
  CONSTRAINT `nodo_colmena_FK_1` FOREIGN KEY (`colmena_id`) REFERENCES `colmena` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;