// Sistema CRUD Completo - Panadería Navideña
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'panaderia_navidad_secret_key_2024';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuracion de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://panaderiaesperanza_user:AZDgJoIDcSSfLLC3oU616NX0jcwMd3Nl@dpg-d450cmshg0os73fph0b0-a/panaderiaesperanza',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Conexion a BD
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error conectando a PostgreSQL:', err);
        return;
    }
    console.log('Conectado a PostgreSQL');
    release();
});

// ==================== MIDDLEWARE DE AUTENTICACION ====================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    }
    next();
};

// ==================== VALIDACIONES ====================
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validateUsername = (username) => {
    return username && username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_]+$/.test(username);
};

const validatePassword = (password) => {
    return password && password.length >= 6 && password.length <= 100;
};

const validatePositiveNumber = (num, max = 999999999999) => {
    const n = parseFloat(num);
    return !isNaN(n) && n > 0 && n <= max && Number.isFinite(n);
};

const validateNonNegativeNumber = (num, max = 999999999999) => {
    const n = parseFloat(num);
    return !isNaN(n) && n >= 0 && n <= max && Number.isFinite(n);
};

// ==================== AUTENTICACION ====================
// Registro de usuario
app.post('/api/auth/registro', async (req, res) => {
    const { username, email, password } = req.body;

    // Validaciones
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!validateUsername(username)) {
        return res.status(400).json({ error: 'Username debe tener 3-50 caracteres alfanuméricos' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 100 caracteres' });
    }

    try {
        // Verificar si usuario existe
        const existingUser = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE username = $1 OR email = $2',
            [username.toLowerCase(), email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'El usuario o email ya existe' });
        }

        // Hash de contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario
        const result = await pool.query(
            `INSERT INTO usuarios (username, email, password_hash, rol, fondos)
             VALUES ($1, $2, $3, 'cliente', 0)
             RETURNING id_usuario, username, email, rol, fondos, fecha_registro`,
            [username.toLowerCase(), email.toLowerCase(), passwordHash]
        );

        const user = result.rows[0];

        // Generar token
        const token = jwt.sign(
            { id: user.id_usuario, username: user.username, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Usuario registrado:', user.username);
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user.id_usuario,
                username: user.username,
                email: user.email,
                rol: user.rol,
                fondos: parseFloat(user.fondos)
            }
        });
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username y contraseña son requeridos' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE',
            [username.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, username: user.username, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Usuario logueado:', user.username);
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id_usuario,
                username: user.username,
                email: user.email,
                rol: user.rol,
                fondos: parseFloat(user.fondos)
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Verificar sesion
app.get('/api/auth/verificar', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id_usuario, username, email, rol, fondos FROM usuarios WHERE id_usuario = $1 AND activo = TRUE',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        res.json({
            user: {
                id: user.id_usuario,
                username: user.username,
                email: user.email,
                rol: user.rol,
                fondos: parseFloat(user.fondos)
            }
        });
    } catch (err) {
        console.error('Error verificando sesión:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== CRUD USUARIOS (ADMIN) ====================
// Obtener todos los usuarios
app.get('/api/usuarios', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id_usuario, username, email, rol, fondos, activo, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err);
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

// Obtener usuario por ID
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    // Solo admin puede ver otros usuarios
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const result = await pool.query(
            'SELECT id_usuario, username, email, rol, fondos, fecha_registro FROM usuarios WHERE id_usuario = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ error: 'Error obteniendo usuario' });
    }
});

// Crear usuario (admin)
app.post('/api/usuarios', authenticateToken, isAdmin, async (req, res) => {
    const { username, email, password, rol = 'cliente', fondos = 0 } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email y password son requeridos' });
    }

    if (!validateUsername(username)) {
        return res.status(400).json({ error: 'Username inválido' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Contraseña inválida' });
    }

    if (!validateNonNegativeNumber(fondos)) {
        return res.status(400).json({ error: 'Fondos inválidos' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO usuarios (username, email, password_hash, rol, fondos)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id_usuario, username, email, rol, fondos, fecha_registro`,
            [username.toLowerCase(), email.toLowerCase(), passwordHash, rol, fondos]
        );

        console.log('Usuario creado por admin:', result.rows[0].username);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El usuario o email ya existe' });
        }
        console.error('Error creando usuario:', err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});

// Actualizar usuario
app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { email, password, rol, activo } = req.body;

    // Solo admin puede editar otros usuarios o cambiar roles
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (req.user.rol !== 'admin' && (rol || activo !== undefined)) {
        return res.status(403).json({ error: 'No puedes cambiar rol o estado' });
    }

    try {
        let query = 'UPDATE usuarios SET ';
        const values = [];
        const updates = [];
        let paramCount = 1;

        if (email) {
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Email inválido' });
            }
            updates.push(`email = $${paramCount++}`);
            values.push(email.toLowerCase());
        }

        if (password) {
            if (!validatePassword(password)) {
                return res.status(400).json({ error: 'Contraseña inválida' });
            }
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(passwordHash);
        }

        if (rol && req.user.rol === 'admin') {
            updates.push(`rol = $${paramCount++}`);
            values.push(rol);
        }

        if (activo !== undefined && req.user.rol === 'admin') {
            updates.push(`activo = $${paramCount++}`);
            values.push(activo);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        query += updates.join(', ') + ` WHERE id_usuario = $${paramCount} RETURNING id_usuario, username, email, rol, fondos, activo`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('Usuario actualizado:', result.rows[0].username);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error actualizando usuario:', err);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});

// Eliminar usuario (admin)
app.delete('/api/usuarios/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = req.params.id;

    if (req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING username',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log('Usuario eliminado:', result.rows[0].username);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});

// ==================== SISTEMA DE FONDOS ====================
// Agregar fondos
app.post('/api/usuarios/fondos/agregar', authenticateToken, async (req, res) => {
    const { cantidad } = req.body;

    if (!validatePositiveNumber(cantidad, 999999999999)) {
        return res.status(400).json({ error: 'Cantidad inválida. Debe ser positiva y no mayor a 999,999,999,999' });
    }

    try {
        // Verificar que no exceda el limite
        const currentFunds = await pool.query(
            'SELECT fondos FROM usuarios WHERE id_usuario = $1',
            [req.user.id]
        );

        const newTotal = parseFloat(currentFunds.rows[0].fondos) + parseFloat(cantidad);

        if (newTotal > 999999999999) {
            return res.status(400).json({
                error: 'No se puede agregar esa cantidad. El límite máximo es $999,999,999,999',
                fondos_actuales: parseFloat(currentFunds.rows[0].fondos),
                maximo_agregar: 999999999999 - parseFloat(currentFunds.rows[0].fondos)
            });
        }

        const result = await pool.query(
            'UPDATE usuarios SET fondos = fondos + $1 WHERE id_usuario = $2 RETURNING fondos',
            [cantidad, req.user.id]
        );

        console.log('Fondos agregados para usuario', req.user.username, ':', cantidad);
        res.json({
            message: 'Fondos agregados exitosamente',
            fondos: parseFloat(result.rows[0].fondos)
        });
    } catch (err) {
        console.error('Error agregando fondos:', err);
        res.status(500).json({ error: 'Error agregando fondos' });
    }
});

// Consultar fondos
app.get('/api/usuarios/fondos', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT fondos FROM usuarios WHERE id_usuario = $1',
            [req.user.id]
        );

        res.json({ fondos: parseFloat(result.rows[0].fondos) });
    } catch (err) {
        console.error('Error consultando fondos:', err);
        res.status(500).json({ error: 'Error consultando fondos' });
    }
});

// ==================== CRUD PRODUCTOS ====================
// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            p.activo,
            p.es_especial,
            i.icono,
            c.nombre as categoria,
            c.id_categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.activo = TRUE
        ORDER BY p.id_producto
    `;

    try {
        const result = await pool.query(query);

        const productos = result.rows.map(row => ({
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria,
            id_categoria: row.id_categoria,
            es_especial: row.es_especial
        }));

        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos:', err);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// Obtener productos de temporada
app.get('/api/productos/temporada/:season', async (req, res) => {
    const season = req.params.season;

    let productNames;
    if (season === 'navidad') {
        productNames = ['Panetone', 'Buñuelos', 'Rosca de Reyes'];
    } else {
        productNames = ['Pan de Muerto', 'Dona Jack Calabaza', 'Dona Telaraña'];
    }

    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            i.icono,
            c.nombre as categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.nombre = ANY($1) AND p.activo = TRUE
        ORDER BY array_position($1, p.nombre)
    `;

    try {
        const result = await pool.query(query, [productNames]);

        const productos = result.rows.map(row => ({
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        }));

        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos de temporada:', err);
        res.status(500).json({ error: 'Error obteniendo productos de temporada' });
    }
});

// Obtener productos aleatorios
app.get('/api/productos/random/:count', async (req, res) => {
    const count = parseInt(req.params.count) || 6;

    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            i.icono,
            c.nombre as categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.activo = TRUE AND p.stock > 0 AND (p.es_especial = FALSE OR p.es_especial IS NULL)
        ORDER BY RANDOM()
        LIMIT $1
    `;

    try {
        const result = await pool.query(query, [count]);

        const productos = result.rows.map(row => ({
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        }));

        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos aleatorios:', err);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// Buscar producto por nombre
app.get('/api/productos/buscar/:nombre', async (req, res) => {
    const nombre = req.params.nombre;

    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            i.icono,
            c.nombre as categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.nombre = $1 AND p.activo = TRUE
    `;

    try {
        const result = await pool.query(query, [nombre]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        };

        res.json(producto);
    } catch (err) {
        console.error('Error buscando producto:', err);
        res.status(500).json({ error: 'Error buscando producto' });
    }
});

// Buscar producto por imagen
app.get('/api/productos/buscar-imagen/:imagen_url', async (req, res) => {
    const imagen_url = decodeURIComponent(req.params.imagen_url);

    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            i.icono,
            c.nombre as categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.imagen_url = $1 AND p.activo = TRUE
    `;

    try {
        const result = await pool.query(query, [imagen_url]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        };

        res.json(producto);
    } catch (err) {
        console.error('Error buscando producto:', err);
        res.status(500).json({ error: 'Error buscando producto' });
    }
});

// Obtener producto por ID
app.get('/api/productos/:id', async (req, res) => {
    const id = req.params.id;

    const query = `
        SELECT
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio,
            p.imagen_url,
            p.stock,
            i.icono,
            c.nombre as categoria,
            c.id_categoria
        FROM productos p
        LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = $1 AND p.activo = TRUE
    `;

    try {
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            precio: parseFloat(row.precio),
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria,
            id_categoria: row.id_categoria
        };

        res.json(producto);
    } catch (err) {
        console.error('Error obteniendo producto:', err);
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});

// Crear producto (admin)
app.post('/api/productos', authenticateToken, isAdmin, async (req, res) => {
    const { nombre, descripcion, precio, id_categoria, imagen_url, stock, es_especial, icono } = req.body;

    if (!nombre || !descripcion || !precio) {
        return res.status(400).json({ error: 'Nombre, descripción y precio son requeridos' });
    }

    if (!validatePositiveNumber(precio, 99999999.99)) {
        return res.status(400).json({ error: 'Precio inválido' });
    }

    if (stock !== undefined && !validateNonNegativeNumber(stock, 99999)) {
        return res.status(400).json({ error: 'Stock inválido' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, id_categoria, imagen_url, stock, es_especial)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [nombre, descripcion, precio, id_categoria || 1, imagen_url || '', stock || 0, es_especial || false]
        );

        // Agregar icono si se proporciona
        if (icono) {
            await pool.query(
                'INSERT INTO iconos_productos (id_producto, icono) VALUES ($1, $2)',
                [result.rows[0].id_producto, icono]
            );
        }

        console.log('Producto creado:', nombre);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creando producto:', err);
        res.status(500).json({ error: 'Error creando producto' });
    }
});

// Actualizar producto (admin)
app.put('/api/productos/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion, precio, id_categoria, imagen_url, stock, es_especial, activo } = req.body;

    try {
        let query = 'UPDATE productos SET ';
        const values = [];
        const updates = [];
        let paramCount = 1;

        if (nombre) {
            updates.push(`nombre = $${paramCount++}`);
            values.push(nombre);
        }
        if (descripcion) {
            updates.push(`descripcion = $${paramCount++}`);
            values.push(descripcion);
        }
        if (precio !== undefined) {
            if (!validatePositiveNumber(precio, 99999999.99)) {
                return res.status(400).json({ error: 'Precio inválido' });
            }
            updates.push(`precio = $${paramCount++}`);
            values.push(precio);
        }
        if (id_categoria) {
            updates.push(`id_categoria = $${paramCount++}`);
            values.push(id_categoria);
        }
        if (imagen_url !== undefined) {
            updates.push(`imagen_url = $${paramCount++}`);
            values.push(imagen_url);
        }
        if (stock !== undefined) {
            if (!validateNonNegativeNumber(stock, 99999)) {
                return res.status(400).json({ error: 'Stock inválido' });
            }
            updates.push(`stock = $${paramCount++}`);
            values.push(stock);
        }
        if (es_especial !== undefined) {
            updates.push(`es_especial = $${paramCount++}`);
            values.push(es_especial);
        }
        if (activo !== undefined) {
            updates.push(`activo = $${paramCount++}`);
            values.push(activo);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        query += updates.join(', ') + ` WHERE id_producto = $${paramCount} RETURNING *`;
        values.push(id);

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log('Producto actualizado:', result.rows[0].nombre);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error actualizando producto:', err);
        res.status(500).json({ error: 'Error actualizando producto' });
    }
});

// Actualizar stock
app.put('/api/productos/:id/stock', async (req, res) => {
    const id = req.params.id;
    const { cantidad } = req.body;

    if (cantidad === undefined || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    try {
        const result = await pool.query(
            'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2 AND stock + $1 >= 0 RETURNING stock',
            [cantidad, id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No hay suficiente stock o producto no encontrado' });
        }

        res.json({ message: 'Stock actualizado', stock: result.rows[0].stock });
    } catch (err) {
        console.error('Error actualizando stock:', err);
        res.status(500).json({ error: 'Error actualizando stock' });
    }
});

// Eliminar producto (admin)
app.delete('/api/productos/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // Soft delete
        const result = await pool.query(
            'UPDATE productos SET activo = FALSE WHERE id_producto = $1 RETURNING nombre',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        console.log('Producto eliminado:', result.rows[0].nombre);
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (err) {
        console.error('Error eliminando producto:', err);
        res.status(500).json({ error: 'Error eliminando producto' });
    }
});

// Obtener categorias
app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categorias ORDER BY id_categoria');
        res.json(result.rows);
    } catch (err) {
        console.error('Error obteniendo categorías:', err);
        res.status(500).json({ error: 'Error obteniendo categorías' });
    }
});

// ==================== CARRITO DE COMPRAS ====================
// Obtener carrito del usuario
app.get('/api/carrito', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_carrito,
                c.cantidad,
                c.fecha_agregado,
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.imagen_url,
                p.stock,
                i.icono
            FROM carrito c
            JOIN productos p ON c.id_producto = p.id_producto
            LEFT JOIN iconos_productos i ON p.id_producto = i.id_producto
            WHERE c.id_usuario = $1 AND p.activo = TRUE
            ORDER BY c.fecha_agregado DESC
        `, [req.user.id]);

        const items = result.rows.map(row => ({
            id_carrito: row.id_carrito,
            id_producto: row.id_producto,
            nombre: row.nombre,
            descripcion: row.descripcion,
            precio: parseFloat(row.precio),
            imagen_url: row.imagen_url,
            stock: row.stock,
            cantidad: row.cantidad,
            icono: row.icono || '',
            subtotal: parseFloat(row.precio) * row.cantidad
        }));

        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        res.json({ items, total, cantidad_items: items.length });
    } catch (err) {
        console.error('Error obteniendo carrito:', err);
        res.status(500).json({ error: 'Error obteniendo carrito' });
    }
});

// Agregar al carrito
app.post('/api/carrito', authenticateToken, async (req, res) => {
    const { id_producto, cantidad } = req.body;

    if (!id_producto || !cantidad) {
        return res.status(400).json({ error: 'ID de producto y cantidad son requeridos' });
    }

    if (!validatePositiveNumber(cantidad, 9999)) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    try {
        // Verificar stock disponible
        const producto = await pool.query(
            'SELECT stock, nombre, activo FROM productos WHERE id_producto = $1',
            [id_producto]
        );

        if (producto.rows.length === 0 || !producto.rows[0].activo) {
            return res.status(404).json({ error: 'Producto no encontrado o no disponible' });
        }

        // Verificar cantidad actual en carrito
        const carritoActual = await pool.query(
            'SELECT cantidad FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
            [req.user.id, id_producto]
        );

        const cantidadActual = carritoActual.rows.length > 0 ? carritoActual.rows[0].cantidad : 0;
        const cantidadTotal = cantidadActual + parseInt(cantidad);

        if (cantidadTotal > producto.rows[0].stock) {
            return res.status(400).json({
                error: 'No hay suficiente stock disponible',
                stock_disponible: producto.rows[0].stock,
                cantidad_en_carrito: cantidadActual
            });
        }

        // Insertar o actualizar carrito
        const result = await pool.query(`
            INSERT INTO carrito (id_usuario, id_producto, cantidad)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_usuario, id_producto)
            DO UPDATE SET cantidad = carrito.cantidad + $3, fecha_agregado = CURRENT_TIMESTAMP
            RETURNING *
        `, [req.user.id, id_producto, cantidad]);

        console.log('Producto agregado al carrito:', producto.rows[0].nombre);
        res.status(201).json({
            message: 'Producto agregado al carrito',
            item: result.rows[0]
        });
    } catch (err) {
        console.error('Error agregando al carrito:', err);
        res.status(500).json({ error: 'Error agregando al carrito' });
    }
});

// Actualizar cantidad en carrito
app.put('/api/carrito/:id_producto', authenticateToken, async (req, res) => {
    const { id_producto } = req.params;
    const { cantidad } = req.body;

    if (!validatePositiveNumber(cantidad, 9999)) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    try {
        // Verificar stock
        const producto = await pool.query(
            'SELECT stock FROM productos WHERE id_producto = $1',
            [id_producto]
        );

        if (producto.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (cantidad > producto.rows[0].stock) {
            return res.status(400).json({
                error: 'No hay suficiente stock',
                stock_disponible: producto.rows[0].stock
            });
        }

        const result = await pool.query(
            'UPDATE carrito SET cantidad = $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
            [cantidad, req.user.id, id_producto]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no está en el carrito' });
        }

        res.json({ message: 'Cantidad actualizada', item: result.rows[0] });
    } catch (err) {
        console.error('Error actualizando carrito:', err);
        res.status(500).json({ error: 'Error actualizando carrito' });
    }
});

// Eliminar del carrito
app.delete('/api/carrito/:id_producto', authenticateToken, async (req, res) => {
    const { id_producto } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM carrito WHERE id_usuario = $1 AND id_producto = $2 RETURNING *',
            [req.user.id, id_producto]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no está en el carrito' });
        }

        res.json({ message: 'Producto eliminado del carrito' });
    } catch (err) {
        console.error('Error eliminando del carrito:', err);
        res.status(500).json({ error: 'Error eliminando del carrito' });
    }
});

// Vaciar carrito
app.delete('/api/carrito', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM carrito WHERE id_usuario = $1', [req.user.id]);
        res.json({ message: 'Carrito vaciado' });
    } catch (err) {
        console.error('Error vaciando carrito:', err);
        res.status(500).json({ error: 'Error vaciando carrito' });
    }
});

// ==================== SISTEMA DE COMPRAS/TICKETS ====================
// Realizar compra
app.post('/api/comprar', authenticateToken, async (req, res) => {
    const { metodo_envio = 'pickup', costo_envio = 0 } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Obtener items del carrito
        const carritoResult = await client.query(`
            SELECT
                c.id_producto,
                c.cantidad,
                p.nombre,
                p.precio,
                p.stock
            FROM carrito c
            JOIN productos p ON c.id_producto = p.id_producto
            WHERE c.id_usuario = $1 AND p.activo = TRUE
        `, [req.user.id]);

        if (carritoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // Calcular total y verificar stock
        let subtotal = 0;
        for (const item of carritoResult.rows) {
            if (item.cantidad > item.stock) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Stock insuficiente para ${item.nombre}`,
                    producto: item.nombre,
                    stock_disponible: item.stock,
                    cantidad_solicitada: item.cantidad
                });
            }
            subtotal += parseFloat(item.precio) * item.cantidad;
        }

        const total = subtotal + parseFloat(costo_envio);

        // Verificar fondos
        const fondosResult = await client.query(
            'SELECT fondos FROM usuarios WHERE id_usuario = $1',
            [req.user.id]
        );

        const fondos = parseFloat(fondosResult.rows[0].fondos);

        if (fondos < total) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Fondos insuficientes',
                fondos_disponibles: fondos,
                total_compra: total
            });
        }

        // Generar número de venta
        const numeroVenta = `VTA-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // Crear venta
        const ventaResult = await client.query(`
            INSERT INTO ventas (numero_venta, id_usuario, subtotal, costo_envio, total, metodo_envio)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [numeroVenta, req.user.id, subtotal, costo_envio, total, metodo_envio]);

        const idVenta = ventaResult.rows[0].id_venta;

        // Crear detalles de venta y actualizar stock
        for (const item of carritoResult.rows) {
            const subtotalItem = parseFloat(item.precio) * item.cantidad;

            await client.query(`
                INSERT INTO detalle_venta (id_venta, id_producto, nombre_producto, cantidad, precio_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [idVenta, item.id_producto, item.nombre, item.cantidad, item.precio, subtotalItem]);

            // Reducir stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
                [item.cantidad, item.id_producto]
            );
        }

        // Descontar fondos
        await client.query(
            'UPDATE usuarios SET fondos = fondos - $1 WHERE id_usuario = $2',
            [total, req.user.id]
        );

        // Vaciar carrito
        await client.query('DELETE FROM carrito WHERE id_usuario = $1', [req.user.id]);

        await client.query('COMMIT');

        // Obtener fondos actualizados
        const fondosActualizados = await pool.query(
            'SELECT fondos FROM usuarios WHERE id_usuario = $1',
            [req.user.id]
        );

        // Generar ticket
        const ticket = {
            nombre_negocio: 'Panadería Pan de Temporada Navideña',
            numero_venta: numeroVenta,
            fecha_compra: ventaResult.rows[0].fecha_compra,
            productos: carritoResult.rows.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precio),
                subtotal: parseFloat(item.precio) * item.cantidad
            })),
            subtotal: subtotal,
            costo_envio: parseFloat(costo_envio),
            total: total,
            metodo_envio: metodo_envio,
            fondos_restantes: parseFloat(fondosActualizados.rows[0].fondos)
        };

        console.log('Compra realizada:', numeroVenta);
        res.status(201).json({
            message: 'Compra realizada exitosamente',
            ticket
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en compra:', err);
        res.status(500).json({ error: 'Error procesando la compra' });
    } finally {
        client.release();
    }
});

// ==================== HISTORIAL DE COMPRAS ====================
// Obtener historial del usuario
app.get('/api/historial', authenticateToken, async (req, res) => {
    try {
        const ventas = await pool.query(`
            SELECT * FROM ventas
            WHERE id_usuario = $1
            ORDER BY fecha_compra DESC
        `, [req.user.id]);

        const historial = [];

        for (const venta of ventas.rows) {
            const detalles = await pool.query(
                'SELECT * FROM detalle_venta WHERE id_venta = $1',
                [venta.id_venta]
            );

            historial.push({
                id_venta: venta.id_venta,
                numero_venta: venta.numero_venta,
                fecha_compra: venta.fecha_compra,
                subtotal: parseFloat(venta.subtotal),
                costo_envio: parseFloat(venta.costo_envio),
                total: parseFloat(venta.total),
                metodo_envio: venta.metodo_envio,
                estado: venta.estado,
                productos: detalles.rows.map(d => ({
                    nombre: d.nombre_producto,
                    cantidad: d.cantidad,
                    precio_unitario: parseFloat(d.precio_unitario),
                    subtotal: parseFloat(d.subtotal)
                }))
            });
        }

        res.json(historial);
    } catch (err) {
        console.error('Error obteniendo historial:', err);
        res.status(500).json({ error: 'Error obteniendo historial' });
    }
});

// Obtener ticket específico
app.get('/api/historial/:numero_venta', authenticateToken, async (req, res) => {
    const { numero_venta } = req.params;

    try {
        const venta = await pool.query(`
            SELECT * FROM ventas
            WHERE numero_venta = $1 AND (id_usuario = $2 OR $3 = 'admin')
        `, [numero_venta, req.user.id, req.user.rol]);

        if (venta.rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        const detalles = await pool.query(
            'SELECT * FROM detalle_venta WHERE id_venta = $1',
            [venta.rows[0].id_venta]
        );

        const ticket = {
            nombre_negocio: 'Panadería Pan de Temporada Navideña',
            numero_venta: venta.rows[0].numero_venta,
            fecha_compra: venta.rows[0].fecha_compra,
            productos: detalles.rows.map(d => ({
                nombre: d.nombre_producto,
                cantidad: d.cantidad,
                precio_unitario: parseFloat(d.precio_unitario),
                subtotal: parseFloat(d.subtotal)
            })),
            subtotal: parseFloat(venta.rows[0].subtotal),
            costo_envio: parseFloat(venta.rows[0].costo_envio),
            total: parseFloat(venta.rows[0].total),
            metodo_envio: venta.rows[0].metodo_envio
        };

        res.json(ticket);
    } catch (err) {
        console.error('Error obteniendo ticket:', err);
        res.status(500).json({ error: 'Error obteniendo ticket' });
    }
});

// ==================== ESTADISTICAS ADMIN ====================
// Obtener todas las ventas (admin)
app.get('/api/admin/ventas', authenticateToken, isAdmin, async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;

    try {
        let query = `
            SELECT
                v.*,
                u.username
            FROM ventas v
            JOIN usuarios u ON v.id_usuario = u.id_usuario
        `;
        const params = [];

        if (fecha_inicio && fecha_fin) {
            query += ' WHERE v.fecha_compra BETWEEN $1 AND $2';
            params.push(fecha_inicio, fecha_fin);
        } else if (fecha_inicio) {
            query += ' WHERE v.fecha_compra >= $1';
            params.push(fecha_inicio);
        } else if (fecha_fin) {
            query += ' WHERE v.fecha_compra <= $1';
            params.push(fecha_fin);
        }

        query += ' ORDER BY v.fecha_compra DESC';

        const ventas = await pool.query(query, params);

        // Obtener detalles para cada venta
        const resultado = [];
        for (const venta of ventas.rows) {
            const detalles = await pool.query(
                'SELECT * FROM detalle_venta WHERE id_venta = $1',
                [venta.id_venta]
            );

            resultado.push({
                ...venta,
                total: parseFloat(venta.total),
                subtotal: parseFloat(venta.subtotal),
                costo_envio: parseFloat(venta.costo_envio),
                productos: detalles.rows
            });
        }

        res.json(resultado);
    } catch (err) {
        console.error('Error obteniendo ventas:', err);
        res.status(500).json({ error: 'Error obteniendo ventas' });
    }
});

// Estadísticas generales
app.get('/api/admin/estadisticas', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Total ventas
        const totalVentas = await pool.query(
            'SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as monto FROM ventas'
        );

        // Ventas por día (últimos 30 días)
        const ventasPorDia = await pool.query(`
            SELECT
                DATE(fecha_compra) as fecha,
                COUNT(*) as cantidad,
                SUM(total) as monto
            FROM ventas
            WHERE fecha_compra >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(fecha_compra)
            ORDER BY fecha DESC
        `);

        // Productos más vendidos
        const productosMasVendidos = await pool.query(`
            SELECT
                nombre_producto,
                SUM(cantidad) as total_vendido,
                SUM(subtotal) as total_ingresos
            FROM detalle_venta
            GROUP BY nombre_producto
            ORDER BY total_vendido DESC
            LIMIT 10
        `);

        // Usuarios con más compras
        const mejoresClientes = await pool.query(`
            SELECT
                u.username,
                COUNT(v.id_venta) as total_compras,
                SUM(v.total) as total_gastado
            FROM usuarios u
            JOIN ventas v ON u.id_usuario = v.id_usuario
            GROUP BY u.id_usuario, u.username
            ORDER BY total_gastado DESC
            LIMIT 10
        `);

        // Ventas por categoría
        const ventasPorCategoria = await pool.query(`
            SELECT
                c.nombre as categoria,
                SUM(dv.cantidad) as total_vendido,
                SUM(dv.subtotal) as total_ingresos
            FROM detalle_venta dv
            JOIN productos p ON dv.id_producto = p.id_producto
            JOIN categorias c ON p.id_categoria = c.id_categoria
            GROUP BY c.id_categoria, c.nombre
            ORDER BY total_ingresos DESC
        `);

        // Total usuarios
        const totalUsuarios = await pool.query(
            'SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'
        );

        // Productos con poco stock
        const pocoStock = await pool.query(`
            SELECT nombre, stock
            FROM productos
            WHERE activo = TRUE AND stock < 10
            ORDER BY stock ASC
        `);

        res.json({
            resumen: {
                total_ventas: parseInt(totalVentas.rows[0].total),
                monto_total: parseFloat(totalVentas.rows[0].monto),
                total_usuarios: parseInt(totalUsuarios.rows[0].total)
            },
            ventas_por_dia: ventasPorDia.rows.map(r => ({
                fecha: r.fecha,
                cantidad: parseInt(r.cantidad),
                monto: parseFloat(r.monto)
            })),
            productos_mas_vendidos: productosMasVendidos.rows.map(r => ({
                nombre: r.nombre_producto,
                cantidad: parseInt(r.total_vendido),
                ingresos: parseFloat(r.total_ingresos)
            })),
            mejores_clientes: mejoresClientes.rows.map(r => ({
                username: r.username,
                compras: parseInt(r.total_compras),
                gastado: parseFloat(r.total_gastado)
            })),
            ventas_por_categoria: ventasPorCategoria.rows.map(r => ({
                categoria: r.categoria,
                cantidad: parseInt(r.total_vendido),
                ingresos: parseFloat(r.total_ingresos)
            })),
            productos_poco_stock: pocoStock.rows
        });
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Cierre de conexion
process.on('SIGINT', async () => {
    console.log('\nCerrando conexión a PostgreSQL...');
    await pool.end();
    console.log('Conexión cerrada');
    process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Server corriendo en http://localhost:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
