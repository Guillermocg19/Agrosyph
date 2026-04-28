const reporteForm       = document.getElementById('reporteForm');
const reporteId         = document.getElementById('reporteId');
const cultivo           = document.getElementById('cultivo');
const etapa             = document.getElementById('etapa');
const plaga             = document.getElementById('plaga');
const descripcion       = document.getElementById('descripcion');
const ubicacion         = document.getElementById('ubicacion');
const imagen            = document.getElementById('imagen');
const latitud           = document.getElementById('latitud');
const longitud          = document.getElementById('longitud');
const btnUbicacion      = document.getElementById('btnUbicacion');
const textoUbicacion    = document.getElementById('textoUbicacion');
const mensajeReporte    = document.getElementById('mensajeReporte');
const contenedorReportes= document.getElementById('contenedorReportes');
const saludoUsuario     = document.getElementById('saludoUsuario');
const btnCerrarSesion   = document.getElementById('btnCerrarSesion');
const tituloFormulario  = document.getElementById('tituloFormulario');
const btnGuardar        = document.getElementById('btnGuardar');
const btnCancelarEdicion= document.getElementById('btnCancelarEdicion');
const busquedaReporte   = document.getElementById('busquedaReporte');
const totalReportes     = document.getElementById('totalReportes');
const totalConImagen    = document.getElementById('totalConImagen');
const misReportes       = document.getElementById('misReportes');
const btnVistaTodos     = document.getElementById('btnVistaTodos');
const btnVistaMios      = document.getElementById('btnVistaMios');

const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioAgrosyph'));
let reportesGlobales = [];
let vistaActual = 'todos';
let mapa, marcadores = [];

if (!usuarioGuardado) window.location.href = 'index.html';

saludoUsuario.textContent = usuarioGuardado.nombre;
const avatarEl = document.getElementById('avatarLetra');
if (avatarEl) avatarEl.textContent = usuarioGuardado.nombre[0].toUpperCase();

btnCerrarSesion.addEventListener('click', () => {
    localStorage.removeItem('usuarioAgrosyph');
    window.location.href = 'index.html';
});

/* ── MAPA REPORTES ───────────────────────────────────────────── */
function iniciarMapa() {
    mapa = L.map('mapaReportes').setView([25.7905, -108.9859], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);
}

function actualizarMapa(reportes) {
    marcadores.forEach(m => mapa.removeLayer(m));
    marcadores = [];
    const conCoords = reportes.filter(r => r.latitud != null && r.longitud != null);
    if (!conCoords.length) { mapa.setView([25.7905, -108.9859], 11); return; }
    const bounds = [];
    conCoords.forEach(r => {
        const m = L.marker([Number(r.latitud), Number(r.longitud)])
            .addTo(mapa)
            .bindPopup(`<strong>${r.cultivo} — ${r.tipo_plaga}</strong><br>${r.ubicacion}<br><small>${r.nombre_usuario}</small>`);
        marcadores.push(m);
        bounds.push([Number(r.latitud), Number(r.longitud)]);
    });
    mapa.fitBounds(bounds, { padding: [30, 30] });
}

/* ── GPS ─────────────────────────────────────────────────────── */
btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) { textoUbicacion.textContent = 'Geolocalización no soportada'; return; }
    textoUbicacion.textContent = 'Obteniendo ubicación…';
    navigator.geolocation.getCurrentPosition(
        pos => {
            latitud.value  = pos.coords.latitude.toFixed(7);
            longitud.value = pos.coords.longitude.toFixed(7);
            textoUbicacion.textContent = `Lat: ${latitud.value}, Lng: ${longitud.value}`;
            // Mover picker si existe
            if (window.pickerMap && window.pickerMarker) {
                window.pickerMap.setView([pos.coords.latitude, pos.coords.longitude], 14);
                window.pickerMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
            } else if (window.pickerMap) {
                window.pickerMap.setView([pos.coords.latitude, pos.coords.longitude], 14);
                window.pickerMarker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(window.pickerMap);
            }
        },
        () => { textoUbicacion.textContent = 'No se pudo obtener la ubicación'; }
    );
});

/* ── GPS MANUAL (inputs lat/lng directos) ────────────────────── */
function syncManualGPS() {
    const latInput = document.getElementById('latManual');
    const lngInput = document.getElementById('lngManual');
    if (!latInput || !lngInput) return;

    function aplicar() {
        const la = parseFloat(latInput.value);
        const lo = parseFloat(lngInput.value);
        if (isNaN(la) || isNaN(lo)) return;
        latitud.value  = la.toFixed(7);
        longitud.value = lo.toFixed(7);
        textoUbicacion.textContent = `Lat: ${la.toFixed(5)}, Lng: ${lo.toFixed(5)}`;
        if (window.pickerMap) {
            window.pickerMap.setView([la, lo], 14);
            if (window.pickerMarker) window.pickerMarker.setLatLng([la, lo]);
            else window.pickerMarker = L.marker([la, lo]).addTo(window.pickerMap);
        }
    }
    latInput.addEventListener('change', aplicar);
    lngInput.addEventListener('change', aplicar);
}

/* ── EDICIÓN ─────────────────────────────────────────────────── */
function activarModoEdicion(reporte) {
    if (Number(reporte.id_usuario) !== Number(usuarioGuardado.id)) {
        alert('Solo puedes editar tus propios reportes'); return;
    }
    reporteId.value   = reporte.id;
    cultivo.value     = reporte.cultivo;
    etapa.value       = reporte.etapa_fenologica;
    plaga.value       = reporte.tipo_plaga;
    descripcion.value = reporte.descripcion;
    ubicacion.value   = reporte.ubicacion;
    latitud.value     = reporte.latitud  || '';
    longitud.value    = reporte.longitud || '';
    textoUbicacion.textContent = reporte.latitud && reporte.longitud
        ? `Lat: ${reporte.latitud}, Lng: ${reporte.longitud}`
        : 'Sin coordenadas';
    tituloFormulario.textContent = 'Editar reporte';
    btnGuardar.textContent       = 'Actualizar reporte';
    btnCancelarEdicion.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limpiarFormulario() {
    reporteForm.reset();
    reporteId.value  = '';
    latitud.value    = '';
    longitud.value   = '';
    textoUbicacion.textContent   = 'Sin coordenadas';
    tituloFormulario.textContent = 'Nuevo reporte';
    btnGuardar.textContent       = 'Guardar reporte';
    btnCancelarEdicion.classList.add('oculto');
    mensajeReporte.textContent   = '';
    // reset file drop
    const ft = document.getElementById('fileDropText');
    const fl = document.getElementById('fileDropLabel');
    if (ft) ft.textContent = 'Arrastra una imagen o haz clic para seleccionar';
    if (fl) fl.classList.remove('has-file');
}

btnCancelarEdicion.addEventListener('click', limpiarFormulario);

/* ── STATS ───────────────────────────────────────────────────── */
function actualizarResumen(reportes) {
    totalReportes.textContent   = reportes.length;
    totalConImagen.textContent  = reportes.filter(r => r.imagen).length;
    misReportes.textContent     = reportes.filter(r => Number(r.id_usuario) === Number(usuarioGuardado.id)).length;
}

/* ── RENDER TARJETAS ─────────────────────────────────────────── */
function fmtFecha(str) {
    return new Date(str).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Cache de recomendaciones para no repetir fetch
const _recoCache = {};

async function cargarRecomendaciones(plagaNombre, contenedorId) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    // Buscar la plaga por nombre
    let plagaId = null;
    try {
        const plagas = await fetch('/api/plagas').then(r => r.json());
        const found  = plagas.find(p => p.nombre.toLowerCase() === plagaNombre.toLowerCase());
        if (found) plagaId = found.id;
    } catch(e) {}

    if (!plagaId) {
        cont.innerHTML = '<p style="color:var(--text3);font-size:.72rem">No hay recomendaciones registradas para esta plaga.</p>';
        return;
    }

    // Usar cache si ya se cargó
    if (_recoCache[plagaId]) {
        renderRecos(cont, _recoCache[plagaId]);
        return;
    }

    cont.innerHTML = '<p style="color:var(--text3);font-size:.72rem">Cargando recomendaciones…</p>';
    try {
        const recos = await fetch(`/api/plagas/${plagaId}/recomendaciones`).then(r => r.json());
        _recoCache[plagaId] = recos;
        renderRecos(cont, recos);
    } catch(e) {
        cont.innerHTML = '<p style="color:var(--r600);font-size:.72rem">Error al cargar.</p>';
    }
}

function renderRecos(cont, recos) {
    if (!recos.length) {
        cont.innerHTML = '<p style="color:var(--text3);font-size:.72rem">Sin recomendaciones registradas.</p>';
        return;
    }
    cont.innerHTML = recos.map(r => `
        <div style="background:var(--bg2);border-left:3px solid var(--g400);border-radius:0 var(--r8) var(--r8) 0;padding:9px 12px;margin-bottom:7px">
            <div style="font-size:.78rem;font-weight:600;color:var(--text);margin-bottom:3px">${r.tratamiento}</div>
            <div style="font-size:.68rem;color:var(--text2);font-family:var(--mono)">
                <b>Productos:</b> ${r.productos_sugeridos || '—'} &nbsp;·&nbsp; <b>Dosis:</b> ${r.dosis || '—'}
            </div>
        </div>`).join('');
}

function renderizarReportes(reportes) {
    if (!reportes.length) {
        contenedorReportes.innerHTML = '<p style="padding:16px;font-size:.8rem;color:var(--text3)">No hay reportes que coincidan.</p>';
        actualizarMapa([]);
        return;
    }

    contenedorReportes.innerHTML = '';

    reportes.forEach(reporte => {
        const esMio   = Number(reporte.id_usuario) === Number(usuarioGuardado.id);
        const recoId  = `recos-${reporte.id}`;
        const detId   = `det-${reporte.id}`;
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('reporte-item');
        tarjeta.style.cursor = 'pointer';

        tarjeta.innerHTML = `
            <!-- CABECERA (siempre visible, clic para expandir) -->
            <div class="rep-head rep-toggle" data-target="${detId}">
                <h3>${reporte.cultivo} — ${reporte.tipo_plaga}</h3>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                    <span class="rep-fecha">${fmtFecha(reporte.fecha_reporte)}</span>
                    <span class="rep-chevron" id="chev-${reporte.id}" style="font-size:.75rem;color:var(--text3);transition:transform .2s">▼</span>
                </div>
            </div>

            <!-- PREVIEW (badges siempre visibles) -->
            <div class="rep-meta">
                <span class="rep-badge rb-etapa">${reporte.etapa_fenologica}</span>
                <span class="rep-badge rb-usuario">👤 ${reporte.nombre_usuario}</span>
                <span class="rep-badge rb-ubicacion">📍 ${reporte.ubicacion}</span>
            </div>

            <!-- DETALLE EXPANDIBLE -->
            <div id="${detId}" style="display:none;margin-top:10px;animation:fadeIn .2s ease">

                <!-- Descripción -->
                <div style="font-size:.75rem;color:var(--text2);line-height:1.6;margin-bottom:10px;padding:9px 12px;background:var(--bg2);border-radius:var(--r8)">
                    ${reporte.descripcion}
                </div>

                <!-- GPS -->
                ${reporte.latitud && reporte.longitud ? `
                <div style="font-size:.68rem;font-family:var(--mono);color:var(--text3);margin-bottom:8px">
                    📌 Coordenadas: ${Number(reporte.latitud).toFixed(5)}, ${Number(reporte.longitud).toFixed(5)}
                </div>` : ''}

                <!-- Imagen -->
                ${reporte.imagen ? `
                <img src="/uploads/${reporte.imagen}" alt="Imagen del reporte" class="imagen-reporte" style="margin-bottom:10px">
                ` : ''}

                <!-- Recomendaciones -->
                <div style="margin-bottom:10px">
                    <p style="font-size:.63rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text3);margin-bottom:7px">
                        💊 Recomendaciones de tratamiento
                    </p>
                    <div id="${recoId}">
                        <p style="color:var(--text3);font-size:.72rem">Cargando…</p>
                    </div>
                </div>

                <!-- Acciones -->
                <div class="rep-acciones">
                    ${esMio ? `<button class="btn-editar">✏️ Editar</button>` : ''}
                    ${esMio ? `<button class="btn-eliminar">🗑 Eliminar</button>` : ''}
                </div>
            </div>
        `;

        contenedorReportes.appendChild(tarjeta);

        // ── TOGGLE EXPANDIR ──────────────────────────────────
        tarjeta.querySelector('.rep-toggle').addEventListener('click', function(e) {
            // No expandir si se hace clic en botones de acción
            if (e.target.closest('.rep-acciones')) return;

            const det   = document.getElementById(detId);
            const chev  = document.getElementById(`chev-${reporte.id}`);
            const abierto = det.style.display !== 'none';

            // Cerrar todos los demás
            document.querySelectorAll('.reporte-item [id^="det-"]').forEach(d => {
                if (d.id !== detId) {
                    d.style.display = 'none';
                    const c = document.getElementById(`chev-${d.id.replace('det-','')}`);
                    if (c) c.style.transform = '';
                }
            });

            if (abierto) {
                det.style.display = 'none';
                chev.style.transform = '';
            } else {
                det.style.display = 'block';
                chev.style.transform = 'rotate(180deg)';
                // Cargar recomendaciones la primera vez
                const recoEl = document.getElementById(recoId);
                if (recoEl && recoEl.innerHTML.includes('Cargando')) {
                    cargarRecomendaciones(reporte.tipo_plaga, recoId);
                }
            }
        });

        // ── BOTONES ──────────────────────────────────────────
        tarjeta.querySelector('.btn-editar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            activarModoEdicion(reporte);
        });
        tarjeta.querySelector('.btn-eliminar')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('¿Eliminar este reporte?')) return;
            try {
                const res  = await fetch(`/api/reportes/${reporte.id}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) { alert(data.mensaje); return; }
                await cargarReportes();
                limpiarFormulario();
            } catch (err) { alert('Error al eliminar el reporte'); }
        });
    });

    actualizarMapa(reportes);
}

/* ── CARGA Y FILTRO ──────────────────────────────────────────── */
async function cargarReportes() {
    contenedorReportes.innerHTML = '<p style="padding:16px;font-size:.8rem;color:var(--text3)">Cargando reportes…</p>';
    try {
        const res      = await fetch('/api/reportes');
        const reportes = await res.json();
        if (!res.ok) { contenedorReportes.innerHTML = '<p style="padding:16px;color:var(--r600)">Error al cargar reportes</p>'; return; }
        reportesGlobales = reportes;
        actualizarResumen(reportesGlobales);
        aplicarFiltro();
    } catch (e) {
        contenedorReportes.innerHTML = '<p style="padding:16px;color:var(--r600)">Error al conectar con el servidor</p>';
    }
}

function aplicarFiltro() {
    const texto = busquedaReporte.value.trim().toLowerCase();
    let base = [...reportesGlobales];
    if (vistaActual === 'mios') base = base.filter(r => Number(r.id_usuario) === Number(usuarioGuardado.id));
    renderizarReportes(base.filter(r =>
        r.cultivo.toLowerCase().includes(texto) ||
        r.tipo_plaga.toLowerCase().includes(texto)
    ));
}

btnVistaTodos.addEventListener('click', () => {
    vistaActual = 'todos';
    btnVistaTodos.classList.add('activo');
    btnVistaMios.classList.remove('activo');
    aplicarFiltro();
});
btnVistaMios.addEventListener('click', () => {
    vistaActual = 'mios';
    btnVistaMios.classList.add('activo');
    btnVistaTodos.classList.remove('activo');
    aplicarFiltro();
});
busquedaReporte.addEventListener('input', aplicarFiltro);

/* ── SUBMIT ──────────────────────────────────────────────────── */
reporteForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!cultivo.value.trim() || !etapa.value.trim() || !plaga.value.trim() ||
        !descripcion.value.trim() || !ubicacion.value.trim()) {
        setMsg('Completa todos los campos del reporte', true); return;
    }
    const fd = new FormData();
    fd.append('cultivo',           cultivo.value.trim());
    fd.append('etapa_fenologica',  etapa.value.trim());
    fd.append('tipo_plaga',        plaga.value.trim());
    fd.append('descripcion',       descripcion.value.trim());
    fd.append('ubicacion',         ubicacion.value.trim());
    fd.append('latitud',           latitud.value);
    fd.append('longitud',          longitud.value);
    if (imagen.files.length) fd.append('imagen', imagen.files[0]);

    let url    = '/api/reportes';
    let metodo = 'POST';
    if (reporteId.value) { url = `/api/reportes/${reporteId.value}`; metodo = 'PUT'; }
    else fd.append('id_usuario', usuarioGuardado.id);

    try {
        const res  = await fetch(url, { method: metodo, body: fd });
        const data = await res.json();
        if (!res.ok) { setMsg(data.mensaje, true); return; }
        setMsg(data.mensaje, false);
        limpiarFormulario();
        await cargarReportes();
    } catch(e) { setMsg('Error al conectar con el servidor', true); }
});

function setMsg(txt, isError) {
    mensajeReporte.textContent = txt;
    mensajeReporte.style.color = isError ? 'var(--r600)' : 'var(--g600)';
}

/* ── INIT ────────────────────────────────────────────────────── */
iniciarMapa();
cargarReportes();
// Esperar a que el HTML inicialice el picker map antes de sincronizar inputs manuales
window.addEventListener('load', syncManualGPS);