const reporteForm = document.getElementById('reporteForm');
const reporteId = document.getElementById('reporteId');
const cultivo = document.getElementById('cultivo');
const etapa = document.getElementById('etapa');
const plaga = document.getElementById('plaga');
const descripcion = document.getElementById('descripcion');
const ubicacion = document.getElementById('ubicacion');
const imagen = document.getElementById('imagen');
const latitud = document.getElementById('latitud');
const longitud = document.getElementById('longitud');
const btnUbicacion = document.getElementById('btnUbicacion');
const textoUbicacion = document.getElementById('textoUbicacion');

const mensajeReporte = document.getElementById('mensajeReporte');
const contenedorReportes = document.getElementById('contenedorReportes');
const saludoUsuario = document.getElementById('saludoUsuario');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');
const tituloFormulario = document.getElementById('tituloFormulario');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
const busquedaReporte = document.getElementById('busquedaReporte');
const totalReportes = document.getElementById('totalReportes');
const totalConImagen = document.getElementById('totalConImagen');
const misReportes = document.getElementById('misReportes');
const btnVistaTodos = document.getElementById('btnVistaTodos');
const btnVistaMios = document.getElementById('btnVistaMios');

const usuarioGuardado = JSON.parse(localStorage.getItem('usuarioAgrosyph'));
let reportesGlobales = [];
let vistaActual = 'todos';
let mapa;
let marcadores = [];

if (!usuarioGuardado) {
    window.location.href = 'index.html';
}

saludoUsuario.textContent = usuarioGuardado.nombre;

btnCerrarSesion.addEventListener('click', () => {
    localStorage.removeItem('usuarioAgrosyph');
    window.location.href = 'index.html';
});

function iniciarMapa() {
    mapa = L.map('mapaReportes').setView([25.7905, -108.9859], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);
}

function actualizarMapa(reportes) {
    marcadores.forEach(marker => mapa.removeLayer(marker));
    marcadores = [];

    const reportesConCoordenadas = reportes.filter(
        r => r.latitud !== null && r.longitud !== null
    );

    if (reportesConCoordenadas.length === 0) {
        mapa.setView([25.7905, -108.9859], 11);
        return;
    }

    const bounds = [];

    reportesConCoordenadas.forEach(reporte => {
        const marker = L.marker([Number(reporte.latitud), Number(reporte.longitud)])
            .addTo(mapa)
            .bindPopup(`
                <strong>${reporte.cultivo} - ${reporte.tipo_plaga}</strong><br>
                ${reporte.ubicacion}<br>
                Usuario: ${reporte.nombre_usuario}
            `);

        marcadores.push(marker);
        bounds.push([Number(reporte.latitud), Number(reporte.longitud)]);
    });

    mapa.fitBounds(bounds, { padding: [30, 30] });
}

btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
        textoUbicacion.textContent = 'Tu navegador no soporta geolocalización';
        return;
    }

    textoUbicacion.textContent = 'Obteniendo ubicación...';

    navigator.geolocation.getCurrentPosition(
        (posicion) => {
            latitud.value = posicion.coords.latitude.toFixed(7);
            longitud.value = posicion.coords.longitude.toFixed(7);
            textoUbicacion.textContent = `Lat: ${latitud.value}, Lng: ${longitud.value}`;
        },
        () => {
            textoUbicacion.textContent = 'No se pudo obtener la ubicación';
        }
    );
});

function activarModoEdicion(reporte) {
    if (Number(reporte.id_usuario) !== Number(usuarioGuardado.id)) {
        alert('Solo puedes editar tus propios reportes');
        return;
    }

    reporteId.value = reporte.id;
    cultivo.value = reporte.cultivo;
    etapa.value = reporte.etapa_fenologica;
    plaga.value = reporte.tipo_plaga;
    descripcion.value = reporte.descripcion;
    ubicacion.value = reporte.ubicacion;
    latitud.value = reporte.latitud || '';
    longitud.value = reporte.longitud || '';

    textoUbicacion.textContent =
        reporte.latitud && reporte.longitud
            ? `Lat: ${reporte.latitud}, Lng: ${reporte.longitud}`
            : 'Sin coordenadas seleccionadas';

    tituloFormulario.textContent = 'Editar reporte';
    btnGuardar.textContent = 'Actualizar reporte';
    btnCancelarEdicion.classList.remove('oculto');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function limpiarFormulario() {
    reporteForm.reset();
    reporteId.value = '';
    latitud.value = '';
    longitud.value = '';
    textoUbicacion.textContent = 'Sin coordenadas seleccionadas';
    tituloFormulario.textContent = 'Nuevo reporte';
    btnGuardar.textContent = 'Guardar reporte';
    btnCancelarEdicion.classList.add('oculto');
    mensajeReporte.textContent = '';
}

btnCancelarEdicion.addEventListener('click', () => {
    limpiarFormulario();
});

function actualizarResumen(reportes) {
    totalReportes.textContent = reportes.length;
    totalConImagen.textContent = reportes.filter(r => r.imagen).length;
    misReportes.textContent = reportes.filter(r => Number(r.id_usuario) === Number(usuarioGuardado.id)).length;
}

function renderizarReportes(reportes) {
    if (reportes.length === 0) {
        contenedorReportes.innerHTML = '<p>No hay reportes que coincidan.</p>';
        actualizarMapa([]);
        return;
    }

    contenedorReportes.innerHTML = '';

    reportes.forEach(reporte => {
        const esMio = Number(reporte.id_usuario) === Number(usuarioGuardado.id);

        const tarjeta = document.createElement('div');
        tarjeta.classList.add('reporte-item');

        tarjeta.innerHTML = `
            <h3>${reporte.cultivo} - ${reporte.tipo_plaga}</h3>
            <p><strong>Etapa:</strong> ${reporte.etapa_fenologica}</p>
            <p><strong>Descripción:</strong> ${reporte.descripcion}</p>
            <p><strong>Ubicación:</strong> ${reporte.ubicacion}</p>
            <p><strong>Usuario:</strong> ${reporte.nombre_usuario}</p>
            <p><strong>Fecha:</strong> ${new Date(reporte.fecha_reporte).toLocaleString()}</p>
            ${
                reporte.latitud && reporte.longitud
                    ? `<p><strong>Coordenadas:</strong> ${reporte.latitud}, ${reporte.longitud}</p>`
                    : ''
            }
            ${reporte.imagen ? `<img src="/uploads/${reporte.imagen}" alt="Imagen del reporte" class="imagen-reporte">` : ''}
            <div class="acciones-reporte">
                ${esMio ? `<button class="btn-editar">Editar</button>` : ''}
                ${esMio ? `<button class="btn-eliminar">Eliminar</button>` : ''}
            </div>
        `;

        contenedorReportes.appendChild(tarjeta);

        const btnEditar = tarjeta.querySelector('.btn-editar');
        const btnEliminar = tarjeta.querySelector('.btn-eliminar');

        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                activarModoEdicion(reporte);
            });
        }

        if (btnEliminar) {
            btnEliminar.addEventListener('click', async () => {
                const confirmar = confirm('¿Seguro que quieres eliminar este reporte?');
                if (!confirmar) return;

                try {
                    const respuestaEliminar = await fetch(`/api/reportes/${reporte.id}`, {
                        method: 'DELETE'
                    });

                    const dataEliminar = await respuestaEliminar.json();

                    if (!respuestaEliminar.ok) {
                        alert(dataEliminar.mensaje);
                        return;
                    }

                    await cargarReportes();
                    limpiarFormulario();
                } catch (error) {
                    alert('Error al eliminar el reporte');
                    console.error(error);
                }
            });
        }
    });

    actualizarMapa(reportes);
}

async function cargarReportes() {
    try {
        const respuesta = await fetch('/api/reportes');
        const reportes = await respuesta.json();

        if (!respuesta.ok) {
            contenedorReportes.innerHTML = '<p>Error al cargar reportes</p>';
            return;
        }

        reportesGlobales = reportes;
        actualizarResumen(reportesGlobales);
        aplicarFiltro();
    } catch (error) {
        contenedorReportes.innerHTML = '<p>Error al conectar con el servidor</p>';
        console.error(error);
    }
}

function aplicarFiltro() {
    const texto = busquedaReporte.value.trim().toLowerCase();

    let base = [...reportesGlobales];

    if (vistaActual === 'mios') {
        base = base.filter(reporte => Number(reporte.id_usuario) === Number(usuarioGuardado.id));
    }

    const filtrados = base.filter(reporte =>
        reporte.cultivo.toLowerCase().includes(texto) ||
        reporte.tipo_plaga.toLowerCase().includes(texto)
    );

    renderizarReportes(filtrados);
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

reporteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (
        !cultivo.value.trim() ||
        !etapa.value.trim() ||
        !plaga.value.trim() ||
        !descripcion.value.trim() ||
        !ubicacion.value.trim()
    ) {
        mensajeReporte.textContent = 'Completa todos los campos del reporte';
        mensajeReporte.style.color = 'red';
        return;
    }

    const formData = new FormData();
    formData.append('cultivo', cultivo.value.trim());
    formData.append('etapa_fenologica', etapa.value.trim());
    formData.append('tipo_plaga', plaga.value.trim());
    formData.append('descripcion', descripcion.value.trim());
    formData.append('ubicacion', ubicacion.value.trim());
    formData.append('latitud', latitud.value);
    formData.append('longitud', longitud.value);

    if (imagen.files.length > 0) {
        formData.append('imagen', imagen.files[0]);
    }

    let url = '/api/reportes';
    let metodo = 'POST';

    if (reporteId.value) {
        url = `/api/reportes/${reporteId.value}`;
        metodo = 'PUT';
    } else {
        formData.append('id_usuario', usuarioGuardado.id);
    }

    try {
        const respuestaServidor = await fetch(url, {
            method: metodo,
            body: formData
        });

        const data = await respuestaServidor.json();

        if (!respuestaServidor.ok) {
            mensajeReporte.textContent = data.mensaje;
            mensajeReporte.style.color = 'red';
            return;
        }

        mensajeReporte.textContent = data.mensaje;
        mensajeReporte.style.color = 'green';

        limpiarFormulario();
        await cargarReportes();
    } catch (error) {
        mensajeReporte.textContent = 'Error al conectar con el servidor';
        mensajeReporte.style.color = 'red';
        console.error(error);
    }
    
});

iniciarMapa();
cargarReportes();