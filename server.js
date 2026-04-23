const express = require('express');
const path = require('path');
const multer = require('multer');
const conexion = require('./db');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const nombreUnico = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, nombreUnico);
    }
});

const upload = multer({ storage });

app.post('/api/registro', (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    conexion.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (error, resultados) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al verificar usuario' });
        }

        if (resultados.length > 0) {
            return res.status(400).json({ mensaje: 'Ese correo ya está registrado' });
        }

        conexion.query(
            'INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)',
            [nombre, correo, password],
            (error, resultado) => {
                if (error) {
                    return res.status(500).json({ mensaje: 'Error al registrar usuario' });
                }

                res.status(201).json({
                    mensaje: 'Usuario registrado correctamente',
                    usuario: {
                        id: resultado.insertId,
                        nombre,
                        correo
                    }
                });
            }
        );
    });
});

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
    }

    conexion.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (error, resultados) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al iniciar sesión' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const usuario = resultados[0];

        if (usuario.password !== password) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            mensaje: 'Inicio de sesión correcto',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo
            }
        });
    });
});

app.post('/api/reportes', upload.single('imagen'), (req, res) => {
    const { cultivo, etapa_fenologica, tipo_plaga, descripcion, ubicacion, id_usuario, latitud, longitud } = req.body;
    const imagen = req.file ? req.file.filename : null;

    if (!cultivo || !etapa_fenologica || !tipo_plaga || !descripcion || !ubicacion || !id_usuario) {
        return res.status(400).json({ mensaje: 'Todos los campos del reporte son obligatorios' });
    }

    const sql = `
        INSERT INTO reportes (
            cultivo, etapa_fenologica, tipo_plaga, descripcion, ubicacion, id_usuario, imagen, latitud, longitud
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
        sql,
        [cultivo, etapa_fenologica, tipo_plaga, descripcion, ubicacion, id_usuario, imagen, latitud || null, longitud || null],
        (error, resultado) => {
            if (error) {
                return res.status(500).json({ mensaje: 'Error al guardar reporte' });
            }

            res.status(201).json({
                mensaje: 'Reporte guardado correctamente',
                idReporte: resultado.insertId
            });
        }
    );
});

app.put('/api/reportes/:id', upload.single('imagen'), (req, res) => {
    const { id } = req.params;
    const { cultivo, etapa_fenologica, tipo_plaga, descripcion, ubicacion, latitud, longitud } = req.body;

    if (!cultivo || !etapa_fenologica || !tipo_plaga || !descripcion || !ubicacion) {
        return res.status(400).json({ mensaje: 'Todos los campos del reporte son obligatorios' });
    }

    conexion.query('SELECT * FROM reportes WHERE id = ?', [id], (error, resultados) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al buscar reporte' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado' });
        }

        const reporteActual = resultados[0];
        const imagenFinal = req.file ? req.file.filename : reporteActual.imagen;

        const sql = `
            UPDATE reportes
            SET cultivo = ?, etapa_fenologica = ?, tipo_plaga = ?, descripcion = ?, ubicacion = ?, imagen = ?, latitud = ?, longitud = ?
            WHERE id = ?
        `;

        conexion.query(
            sql,
            [cultivo, etapa_fenologica, tipo_plaga, descripcion, ubicacion, imagenFinal, latitud || null, longitud || null, id],
            (error) => {
                if (error) {
                    return res.status(500).json({ mensaje: 'Error al actualizar reporte' });
                }

                res.json({ mensaje: 'Reporte actualizado correctamente' });
            }
        );
    });
});

app.get('/api/reportes', (req, res) => {
    const sql = `
        SELECT 
            reportes.id,
            reportes.cultivo,
            reportes.etapa_fenologica,
            reportes.tipo_plaga,
            reportes.descripcion,
            reportes.ubicacion,
            reportes.fecha_reporte,
            reportes.id_usuario,
            reportes.imagen,
            reportes.latitud,
            reportes.longitud,
            usuarios.nombre AS nombre_usuario
        FROM reportes
        INNER JOIN usuarios ON reportes.id_usuario = usuarios.id
        ORDER BY reportes.fecha_reporte DESC
    `;

    conexion.query(sql, (error, resultados) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al obtener reportes' });
        }

        res.json(resultados);
    });
});

app.delete('/api/reportes/:id', (req, res) => {
    const { id } = req.params;

    conexion.query('DELETE FROM reportes WHERE id = ?', [id], (error, resultado) => {
        if (error) {
            return res.status(500).json({ mensaje: 'Error al eliminar reporte' });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Reporte no encontrado' });
        }

        res.json({ mensaje: 'Reporte eliminado correctamente' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});