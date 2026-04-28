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

// ============================================================
// AGROSYPH — Endpoints nuevos para agregar a server.js
// Pega este contenido ANTES de la línea app.listen(...)
// ============================================================

// ── SENSOR: guardar lectura desde sensor.js ──────────────────
app.post('/api/sensor', (req, res) => {
    const { ph, humedad } = req.body;

    if (ph === undefined || humedad === undefined) {
        return res.status(400).json({ mensaje: 'ph y humedad son obligatorios' });
    }

    conexion.query(
        'INSERT INTO lecturas_sensor (ph, humedad, fecha) VALUES (?, ?, NOW())',
        [ph, humedad],
        (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al guardar lectura' });
            res.status(201).json({ mensaje: 'Lectura guardada', id: resultado.insertId });
        }
    );
});

// ── SENSOR: obtener últimas N lecturas ───────────────────────
app.get('/api/sensor/lecturas', (req, res) => {
    const limite = parseInt(req.query.limite) || 20;

    conexion.query(
        'SELECT * FROM lecturas_sensor ORDER BY fecha DESC LIMIT ?',
        [limite],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener lecturas' });
            res.json(resultados);
        }
    );
});

// ── SENSOR: última lectura (para el dashboard en tiempo real) ─
app.get('/api/sensor/ultima', (req, res) => {
    conexion.query(
        'SELECT * FROM lecturas_sensor ORDER BY fecha DESC LIMIT 1',
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener lectura' });
            if (resultados.length === 0) return res.json(null);
            res.json(resultados[0]);
        }
    );
});

// ── PLAGAS: listar todas ─────────────────────────────────────
app.get('/api/plagas', (req, res) => {
    conexion.query(
        'SELECT * FROM plagas ORDER BY nombre ASC',
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener plagas' });
            res.json(resultados);
        }
    );
});

// ── PLAGAS: obtener una sola plaga por ID ────────────────────
app.get('/api/plagas/:id', (req, res) => {
    conexion.query(
        'SELECT * FROM plagas WHERE id = ?',
        [req.params.id],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener plaga' });
            if (resultados.length === 0) return res.status(404).json({ mensaje: 'Plaga no encontrada' });
            res.json(resultados[0]);
        }
    );
});

// ── RECOMENDACIONES: por plaga ───────────────────────────────
app.get('/api/plagas/:id/recomendaciones', (req, res) => {
    conexion.query(
        'SELECT * FROM recomendaciones WHERE plaga_id = ?',
        [req.params.id],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener recomendaciones' });
            res.json(resultados);
        }
    );
});

// ═══════════════════════════════════════════════════════════════
//  AGROSYPH — Endpoints nuevos para monitoreo avanzado
//  Pega este bloque ANTES de app.listen(...) en server.js
// ═══════════════════════════════════════════════════════════════

// ── UMBRALES DE ALERTA ────────────────────────────────────────
const UMBRAL_PH_WARN = 0.5;   // diferencia que dispara alerta amarilla
const UMBRAL_PH_CRIT = 1.0;   // diferencia que dispara alerta roja
const UMBRAL_HUM_WARN = 15;    // puntos porcentuales
const UMBRAL_HUM_CRIT = 30;

// ── PARCELAS ──────────────────────────────────────────────────
app.get('/api/parcelas', (req, res) => {
    const sql = `
    SELECT p.*, s.id AS sensor_id, s.nombre AS sensor_nombre, s.activo AS sensor_activo,
           l.ph, l.humedad, l.fecha AS ultima_lectura
    FROM parcelas p
    LEFT JOIN sensores s ON s.id_parcela = p.id
    LEFT JOIN lecturas_sensor l ON l.id = (
      SELECT id FROM lecturas_sensor WHERE id_sensor = s.id ORDER BY fecha DESC LIMIT 1
    )
    ORDER BY p.id ASC`;
    conexion.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener parcelas' });
        res.json(rows);
    });
});

app.post('/api/parcelas', (req, res) => {
    const { nombre, descripcion, cultivo, area_hectareas, latitud, longitud, radio_metros } = req.body;
    if (!nombre || !latitud || !longitud)
        return res.status(400).json({ mensaje: 'Nombre y coordenadas son obligatorios' });
    conexion.query(
        'INSERT INTO parcelas (nombre, descripcion, cultivo, area_hectareas, latitud, longitud, radio_metros) VALUES (?,?,?,?,?,?,?)',
        [nombre, descripcion || '', cultivo || '', area_hectareas || 0, latitud, longitud, radio_metros || 150],
        (err, r) => {
            if (err) return res.status(500).json({ mensaje: 'Error al crear parcela' });
            res.status(201).json({ mensaje: 'Parcela creada', id: r.insertId });
        }
    );
});

app.put('/api/parcelas/:id', (req, res) => {
    const { nombre, descripcion, cultivo, area_hectareas, latitud, longitud, radio_metros } = req.body;
    conexion.query(
        'UPDATE parcelas SET nombre=?, descripcion=?, cultivo=?, area_hectareas=?, latitud=?, longitud=?, radio_metros=? WHERE id=?',
        [nombre, descripcion, cultivo, area_hectareas, latitud, longitud, radio_metros, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ mensaje: 'Error al actualizar parcela' });
            res.json({ mensaje: 'Parcela actualizada' });
        }
    );
});

// ── SENSORES ──────────────────────────────────────────────────
app.get('/api/sensores', (req, res) => {
    conexion.query(
        `SELECT s.*, p.nombre AS parcela_nombre,
            l.ph, l.humedad, l.fecha AS ultima_lectura
     FROM sensores s
     LEFT JOIN parcelas p ON p.id = s.id_parcela
     LEFT JOIN lecturas_sensor l ON l.id = (
       SELECT id FROM lecturas_sensor WHERE id_sensor = s.id ORDER BY fecha DESC LIMIT 1
     )
     ORDER BY s.id ASC`,
        (err, rows) => {
            if (err) return res.status(500).json({ mensaje: 'Error al obtener sensores' });
            res.json(rows);
        }
    );
});

// POST sensor con detección automática de alertas
app.post('/api/sensor', (req, res) => {
    const { ph, humedad, id_sensor } = req.body;
    const sensorId = id_sensor || 1;

    if (ph === undefined || humedad === undefined)
        return res.status(400).json({ mensaje: 'ph y humedad son obligatorios' });

    // Obtener última lectura de este sensor para comparar
    conexion.query(
        'SELECT ph, humedad FROM lecturas_sensor WHERE id_sensor = ? ORDER BY fecha DESC LIMIT 1',
        [sensorId],
        (err, prev) => {
            let alerta = 0, motivo = null, nivelAlerta = null;

            if (!err && prev.length) {
                const diffPH = Math.abs(ph - prev[0].ph);
                const diffHum = Math.abs(humedad - prev[0].humedad);
                const alertaPH = diffPH >= UMBRAL_PH_WARN;
                const alertaHum = diffHum >= UMBRAL_HUM_WARN;
                const critica = diffPH >= UMBRAL_PH_CRIT || diffHum >= UMBRAL_HUM_CRIT;

                if (alertaPH || alertaHum) {
                    alerta = 1;
                    nivelAlerta = critica ? 'critica' : 'warn';
                    const partes = [];
                    if (alertaPH) partes.push(`pH cambió ${diffPH.toFixed(2)} (antes: ${prev[0].ph}, ahora: ${ph})`);
                    if (alertaHum) partes.push(`Humedad cambió ${diffHum.toFixed(1)}% (antes: ${prev[0].humedad}%, ahora: ${humedad}%)`);
                    motivo = partes.join(' | ');
                }
            }

            // Guardar lectura
            conexion.query(
                'INSERT INTO lecturas_sensor (ph, humedad, fecha, id_sensor, alerta, motivo_alerta) VALUES (?,?,NOW(),?,?,?)',
                [ph, humedad, sensorId, alerta, motivo],
                (err2, result) => {
                    if (err2) return res.status(500).json({ mensaje: 'Error al guardar lectura' });

                    // Si hay alerta, guardar en tabla alertas
                    if (alerta && nivelAlerta) {
                        conexion.query(
                            'SELECT id_parcela FROM sensores WHERE id = ?', [sensorId],
                            (err3, sens) => {
                                const parcela = sens && sens[0] ? sens[0].id_parcela : null;
                                conexion.query(
                                    'INSERT INTO alertas (id_sensor, id_parcela, tipo, valor_anterior, valor_actual, diferencia, nivel, mensaje) VALUES (?,?,?,?,?,?,?,?)',
                                    [sensorId, parcela, 'combinada', prev[0]?.ph, ph, Math.abs(ph - (prev[0]?.ph || ph)), nivelAlerta, motivo],
                                    () => { }
                                );
                            }
                        );
                    }

                    res.status(201).json({ mensaje: 'Lectura guardada', id: result.insertId, alerta, motivo });
                }
            );
        }
    );
});

// ── LECTURAS (con soporte id_sensor) ─────────────────────────
app.get('/api/sensor/lecturas', (req, res) => {
    const limite = parseInt(req.query.limite) || 20;
    const idSensor = req.query.id_sensor || null;
    const where = idSensor ? 'WHERE id_sensor = ?' : '';
    const params = idSensor ? [idSensor, limite] : [limite];
    conexion.query(
        `SELECT * FROM lecturas_sensor ${where} ORDER BY fecha DESC LIMIT ?`,
        params,
        (err, rows) => {
            if (err) return res.status(500).json({ mensaje: 'Error al obtener lecturas' });
            res.json(rows);
        }
    );
});

app.get('/api/sensor/ultima', (req, res) => {
    const idSensor = req.query.id_sensor || null;
    const where = idSensor ? 'WHERE id_sensor = ?' : '';
    const params = idSensor ? [idSensor] : [];
    conexion.query(
        `SELECT * FROM lecturas_sensor ${where} ORDER BY fecha DESC LIMIT 1`,
        params,
        (err, rows) => {
            if (err) return res.status(500).json({ mensaje: 'Error' });
            res.json(rows[0] || null);
        }
    );
});

// ── ALERTAS ───────────────────────────────────────────────────
app.get('/api/alertas', (req, res) => {
    const limite = parseInt(req.query.limite) || 30;
    conexion.query(
        `SELECT a.*, s.nombre AS sensor_nombre, p.nombre AS parcela_nombre
     FROM alertas a
     LEFT JOIN sensores s ON s.id = a.id_sensor
     LEFT JOIN parcelas p ON p.id = a.id_parcela
     ORDER BY a.creada_en DESC LIMIT ?`,
        [limite],
        (err, rows) => {
            if (err) return res.status(500).json({ mensaje: 'Error al obtener alertas' });
            res.json(rows);
        }
    );
});

app.get('/api/alertas/no-leidas', (req, res) => {
    conexion.query('SELECT COUNT(*) AS total FROM alertas WHERE leida = 0', (err, rows) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        res.json({ total: rows[0].total });
    });
});

app.put('/api/alertas/marcar-leidas', (req, res) => {
    conexion.query('UPDATE alertas SET leida = 1 WHERE leida = 0', (err) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        res.json({ mensaje: 'Alertas marcadas como leídas' });
    });
});

// ═══════════════════════════════════════════════════════════════
//  AGROSYPH — Endpoints adicionales
//  Pega esto en server.js ANTES de app.listen(...)
// ═══════════════════════════════════════════════════════════════

// ── Plagas detectadas por parcela (cruza reportes con parcelas) ─
app.get('/api/parcelas/:id/plagas', (req, res) => {
  const sql = `
    SELECT
      r.tipo_plaga,
      r.cultivo,
      r.descripcion,
      r.fecha_reporte,
      r.imagen,
      u.nombre AS reportado_por,
      p2.nombre AS nombre_plaga,
      p2.sintomas,
      p2.id AS plaga_id
    FROM reportes r
    INNER JOIN parcelas p ON p.id = ?
    LEFT JOIN usuarios u ON u.id = r.id_usuario
    LEFT JOIN plagas p2 ON LOWER(p2.nombre) = LOWER(r.tipo_plaga)
    WHERE r.ubicacion LIKE CONCAT('%', p.nombre, '%')
       OR (
         r.latitud IS NOT NULL AND r.longitud IS NOT NULL AND
         r.latitud  BETWEEN p.latitud  - 0.005 AND p.latitud  + 0.005 AND
         r.longitud BETWEEN p.longitud - 0.005 AND p.longitud + 0.005
       )
    ORDER BY r.fecha_reporte DESC
    LIMIT 10`;
  conexion.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener plagas de parcela' });
    res.json(rows);
  });
});

// ── Parcelas disponibles para selector en dashboard ────────────
app.get('/api/parcelas/selector', (req, res) => {
  const sql = `
    SELECT p.id, p.nombre, p.cultivo, p.latitud, p.longitud,
           s.id AS sensor_id, s.nombre AS sensor_nombre, s.activo AS sensor_activo
    FROM parcelas p
    LEFT JOIN sensores s ON s.id_parcela = p.id
    ORDER BY p.nombre ASC`;
  conexion.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    res.json(rows);
  });
});

// ── Crear parcela + sensor desde el dashboard ──────────────────
app.post('/api/parcelas/nueva-con-sensor', (req, res) => {
  const { nombre, cultivo, latitud, longitud, radio_metros, nombre_sensor } = req.body;
  if (!nombre || !latitud || !longitud)
    return res.status(400).json({ mensaje: 'Nombre y coordenadas son obligatorios' });

  conexion.query(
    'INSERT INTO parcelas (nombre, cultivo, latitud, longitud, radio_metros) VALUES (?,?,?,?,?)',
    [nombre, cultivo || '', latitud, longitud, radio_metros || 150],
    (err, r) => {
      if (err) return res.status(500).json({ mensaje: 'Error al crear parcela' });
      const idParcela = r.insertId;
      const nomSensor = nombre_sensor || `Sensor-${String(idParcela).padStart(3,'0')}`;
      const token     = `token-${nombre.toLowerCase().replace(/\s+/g,'-')}-${idParcela}`;
      conexion.query(
        'INSERT INTO sensores (nombre, id_parcela, activo, token) VALUES (?,?,1,?)',
        [nomSensor, idParcela, token],
        (err2, r2) => {
          if (err2) return res.status(500).json({ mensaje: 'Parcela creada pero error al crear sensor' });
          res.status(201).json({
            mensaje: 'Parcela y sensor creados correctamente',
            id_parcela: idParcela,
            id_sensor:  r2.insertId,
            token
          });
        }
      );
    }
  );
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});