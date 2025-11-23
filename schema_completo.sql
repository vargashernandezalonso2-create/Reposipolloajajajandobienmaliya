-- Schema completo para Sistema CRUD Panadería Navideña
-- PostgreSQL

-- Tabla de usuarios (nueva - reemplaza clientes)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    fondos DECIMAL(15,2) DEFAULT 0.00 CHECK (fondos >= 0 AND fondos <= 999999999999),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de carrito (persistente en BD)
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0 AND cantidad <= 9999),
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_producto)
);

-- Tabla de ventas (tickets)
CREATE TABLE IF NOT EXISTS ventas (
    id_venta SERIAL PRIMARY KEY,
    numero_venta VARCHAR(20) NOT NULL UNIQUE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(15,2) NOT NULL,
    costo_envio DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL,
    metodo_envio VARCHAR(50) DEFAULT 'pickup',
    estado VARCHAR(20) DEFAULT 'completada'
);

-- Tabla de detalle de ventas (productos comprados)
CREATE TABLE IF NOT EXISTS detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    nombre_producto VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

-- Indices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_venta(id_venta);

-- Crear usuario administrador por defecto
-- Password: admin123 (hasheado con bcrypt)
INSERT INTO usuarios (username, email, password_hash, rol, fondos)
VALUES ('admin', 'admin@panaderia.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 999999999999)
ON CONFLICT (username) DO NOTHING;

-- Crear usuario de prueba
-- Password: test123
INSERT INTO usuarios (username, email, password_hash, rol, fondos)
VALUES ('cliente1', 'cliente1@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', 5000)
ON CONFLICT (username) DO NOTHING;
