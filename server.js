// aaa el server con express y postgresql -bynd
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ey middlewares -bynd
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// vavavava configuracion de la conexion a postgresql -bynd
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://panaderiaesperanza_user:AZDgJoIDcSSfLLC3oU616NX0jcwMd3Nl@dpg-d450cmshg0os73fph0b0-a/panaderiaesperanza',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// chintrolas conectamos a la bd -bynd
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err);
        return;
    }
    console.log('✅ Conectado a PostgreSQL');
    release();
});

// q chidoteee ruta para obtener productos de temporada -bynd
app.get('/api/productos/temporada/:season', async (req, res) => {
    const season = req.params.season;
    console.log('🎄 [SERVER] Obteniendo productos de temporada:', season);
    
    // ey definimos que productos mostrar por temporada -bynd
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
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        }));
        
        console.log('✅ Productos de temporada obtenidos:', productos.length);
        res.json(productos);
    } catch (err) {
        console.error('❌ Error obteniendo productos de temporada:', err);
        res.status(500).json({ error: 'Error obteniendo productos de temporada' });
    }
});

// q chidoteee ruta para obtener todos los productos -bynd
app.get('/api/productos', async (req, res) => {
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
        WHERE p.activo = TRUE
        ORDER BY p.id_producto
    `;
    
    try {
        const result = await pool.query(query);
        
        // ey formateamos los datos para el frontend -bynd
        const productos = result.rows.map(row => ({
            id: row.id_producto,
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        }));
        
        console.log('✅ Productos obtenidos:', productos.length);
        res.json(productos);
    } catch (err) {
        console.error('❌ Error obteniendo productos:', err);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// vavavava ruta para obtener productos aleatorios (excluyendo especiales) -bynd
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
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        }));
        
        console.log('✅ Productos aleatorios obtenidos (sin especiales):', productos.length);
        res.json(productos);
    } catch (err) {
        console.error('❌ Error obteniendo productos aleatorios:', err);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// ey ruta para buscar producto por url de imagen -bynd
app.get('/api/productos/buscar-imagen/:imagen_url', async (req, res) => {
    const imagen_url = decodeURIComponent(req.params.imagen_url);
    console.log('🔍 [SERVER] Buscando producto por imagen:', imagen_url);
    
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
            console.warn('⚠️ [SERVER] Producto no encontrado con imagen:', imagen_url);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        };
        
        console.log('✅ [SERVER] Producto encontrado:', producto.name);
        res.json(producto);
    } catch (err) {
        console.error('❌ [SERVER] Error buscando producto:', err);
        res.status(500).json({ error: 'Error buscando producto' });
    }
});

// ey ruta para buscar producto por nombre -bynd
app.get('/api/productos/buscar/:nombre', async (req, res) => {
    const nombre = req.params.nombre;
    console.log('🔍 [SERVER] Buscando producto por nombre:', nombre);
    
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
            console.warn('⚠️ [SERVER] Producto no encontrado:', nombre);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        };
        
        console.log('✅ [SERVER] Producto encontrado:', producto.name);
        res.json(producto);
    } catch (err) {
        console.error('❌ [SERVER] Error buscando producto:', err);
        res.status(500).json({ error: 'Error buscando producto' });
    }
});

// fokeis ruta para obtener un producto por id -bynd
app.get('/api/productos/:id', async (req, res) => {
    const id = req.params.id;
    console.log('🔍 [SERVER] Petición GET /api/productos/:id');
    console.log('🔍 [SERVER] ID recibido:', id);
    console.log('🔍 [SERVER] Tipo de ID:', typeof id);
    
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
        WHERE p.id_producto = $1 AND p.activo = TRUE
    `;
    
    console.log('🔍 [SERVER] Ejecutando query para producto:', id);
    
    try {
        const result = await pool.query(query, [id]);
        
        console.log('📊 [SERVER] Resultados de la query:', result.rows.length, 'producto(s)');
        
        if (result.rows.length === 0) {
            console.warn('⚠️ [SERVER] Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = result.rows[0];
        const producto = {
            id: row.id_producto,
            icon: row.icono || '🍞',
            name: row.nombre,
            desc: row.descripcion,
            price: `$${row.precio}`,
            image: row.imagen_url,
            stock: row.stock,
            categoria: row.categoria
        };
        
        console.log('✅ [SERVER] Producto encontrado:', producto.name);
        console.log('📦 [SERVER] Datos del producto:', JSON.stringify(producto, null, 2));
        res.json(producto);
    } catch (err) {
        console.error('❌ [SERVER] Error obteniendo producto:', err);
        console.error('❌ [SERVER] Error details:', err.message);
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});

// chintrolas ruta para actualizar stock -bynd
app.put('/api/productos/:id/stock', async (req, res) => {
    const id = req.params.id;
    const { cantidad } = req.body;
    
    if (!cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }
    
    const query = 'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2';
    
    try {
        const result = await pool.query(query, [cantidad, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        console.log('✅ Stock actualizado para producto:', id);
        res.json({ message: 'Stock actualizado correctamente', cantidad });
    } catch (err) {
        console.error('❌ Error actualizando stock:', err);
        res.status(500).json({ error: 'Error actualizando stock' });
    }
});

// vavavava ruta para obtener categorias -bynd
app.get('/api/categorias', async (req, res) => {
    const query = 'SELECT * FROM categorias';
    
    try {
        const result = await pool.query(query);
        console.log('✅ Categorías obtenidas:', result.rows.length);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Error obteniendo categorías:', err);
        res.status(500).json({ error: 'Error obteniendo categorías' });
    }
});

// ey manejamos el cierre de conexion -bynd
process.on('SIGINT', async () => {
    console.log('\n⚠️ Cerrando conexión a PostgreSQL...');
    await pool.end();
    console.log('✅ Conexión cerrada');
    process.exit(0);
});

// q chidoteee iniciamos el server -bynd
app.listen(PORT, () => {
    console.log(`🎊 Server corriendo en http://localhost:${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
