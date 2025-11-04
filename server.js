// aaa el server con express y mysql -bynd
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// ey middlewares -bynd
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// vavavava configuracion de la conexion a mysql -bynd
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0', // chintrolas cambia esto por tu password -bynd
    database: 'panaderia_esperanza'
});

// chintrolas conectamos a la bd -bynd
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// q chidoteee ruta para obtener productos de temporada -bynd
app.get('/api/productos/temporada/:season', (req, res) => {
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
        WHERE p.nombre IN (?) AND p.activo = TRUE
        ORDER BY FIELD(p.nombre, ?)
    `;
    
    db.query(query, [productNames, productNames], (err, results) => {
        if (err) {
            console.error('❌ Error obteniendo productos de temporada:', err);
            return res.status(500).json({ error: 'Error obteniendo productos de temporada' });
        }
        
        const productos = results.map(row => ({
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
    });
});

// q chidoteee ruta para obtener todos los productos -bynd
app.get('/api/productos', (req, res) => {
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
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error obteniendo productos:', err);
            return res.status(500).json({ error: 'Error obteniendo productos' });
        }
        
        // ey formateamos los datos para el frontend -bynd
        const productos = results.map(row => ({
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
    });
});

// vavavava ruta para obtener productos aleatorios (excluyendo especiales) -bynd
app.get('/api/productos/random/:count', (req, res) => {
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
        ORDER BY RAND()
        LIMIT ?
    `;
    
    db.query(query, [count], (err, results) => {
        if (err) {
            console.error('❌ Error obteniendo productos aleatorios:', err);
            return res.status(500).json({ error: 'Error obteniendo productos' });
        }
        
        const productos = results.map(row => ({
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
    });
});

// ey ruta para buscar producto por url de imagen -bynd
app.get('/api/productos/buscar-imagen/:imagen_url', (req, res) => {
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
        WHERE p.imagen_url = ? AND p.activo = TRUE
    `;
    
    db.query(query, [imagen_url], (err, results) => {
        if (err) {
            console.error('❌ [SERVER] Error buscando producto:', err);
            return res.status(500).json({ error: 'Error buscando producto' });
        }
        
        if (results.length === 0) {
            console.warn('⚠️ [SERVER] Producto no encontrado con imagen:', imagen_url);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = results[0];
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
    });
});

// ey ruta para buscar producto por nombre -bynd
app.get('/api/productos/buscar/:nombre', (req, res) => {
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
        WHERE p.nombre = ? AND p.activo = TRUE
    `;
    
    db.query(query, [nombre], (err, results) => {
        if (err) {
            console.error('❌ [SERVER] Error buscando producto:', err);
            return res.status(500).json({ error: 'Error buscando producto' });
        }
        
        if (results.length === 0) {
            console.warn('⚠️ [SERVER] Producto no encontrado:', nombre);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = results[0];
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
    });
});

// fokeis ruta para obtener un producto por id -bynd
app.get('/api/productos/:id', (req, res) => {
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
        WHERE p.id_producto = ? AND p.activo = TRUE
    `;
    
    console.log('🔍 [SERVER] Ejecutando query para producto:', id);
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ [SERVER] Error obteniendo producto:', err);
            console.error('❌ [SERVER] Error details:', err.message);
            return res.status(500).json({ error: 'Error obteniendo producto' });
        }
        
        console.log('📊 [SERVER] Resultados de la query:', results.length, 'producto(s)');
        
        if (results.length === 0) {
            console.warn('⚠️ [SERVER] Producto no encontrado con ID:', id);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const row = results[0];
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
    });
});

// chintrolas ruta para actualizar stock -bynd
app.put('/api/productos/:id/stock', (req, res) => {
    const id = req.params.id;
    const { cantidad } = req.body;
    
    if (!cantidad || isNaN(cantidad)) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }
    
    const query = 'UPDATE productos SET stock = stock + ? WHERE id_producto = ?';
    
    db.query(query, [cantidad, id], (err, result) => {
        if (err) {
            console.error('❌ Error actualizando stock:', err);
            return res.status(500).json({ error: 'Error actualizando stock' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        console.log('✅ Stock actualizado para producto:', id);
        res.json({ message: 'Stock actualizado correctamente', cantidad });
    });
});

// vavavava ruta para obtener categorias -bynd
app.get('/api/categorias', (req, res) => {
    const query = 'SELECT * FROM categorias';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error obteniendo categorías:', err);
            return res.status(500).json({ error: 'Error obteniendo categorías' });
        }
        
        console.log('✅ Categorías obtenidas:', results.length);
        res.json(results);
    });
});

// ey manejamos el cierre de conexion -bynd
process.on('SIGINT', () => {
    console.log('\n⚠️ Cerrando conexión a MySQL...');
    db.end((err) => {
        if (err) {
            console.error('❌ Error cerrando conexión:', err);
        } else {
            console.log('✅ Conexión cerrada');
        }
        process.exit(0);
    });
});

// q chidoteee iniciamos el server -bynd
app.listen(PORT, () => {
    console.log(`🎊 Server corriendo en http://localhost:${PORT}`);
});