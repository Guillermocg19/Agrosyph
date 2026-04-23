const btnLogin = document.getElementById('btnLogin');
const btnRegistro = document.getElementById('btnRegistro');
const formLogin = document.getElementById('formLogin');
const formRegistro = document.getElementById('formRegistro');
const mensaje = document.getElementById('mensaje');

const registroForm = document.getElementById('registroForm');
const registroNombre = document.getElementById('registroNombre');
const registroCorreo = document.getElementById('registroCorreo');
const registroPassword = document.getElementById('registroPassword');

const loginForm = document.getElementById('loginForm');
const loginCorreo = document.getElementById('loginCorreo');
const loginPassword = document.getElementById('loginPassword');

btnLogin.addEventListener('click', () => {
    btnLogin.classList.add('activo');
    btnRegistro.classList.remove('activo');

    formLogin.classList.remove('oculto');
    formLogin.classList.add('visible');

    formRegistro.classList.remove('visible');
    formRegistro.classList.add('oculto');

    mensaje.textContent = '';
});

btnRegistro.addEventListener('click', () => {
    btnRegistro.classList.add('activo');
    btnLogin.classList.remove('activo');

    formRegistro.classList.remove('oculto');
    formRegistro.classList.add('visible');

    formLogin.classList.remove('visible');
    formLogin.classList.add('oculto');

    mensaje.textContent = '';
});

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = registroNombre.value.trim();
    const correo = registroCorreo.value.trim();
    const password = registroPassword.value.trim();

    if (!nombre || !correo || !password) {
        mensaje.textContent = 'Completa todos los campos';
        mensaje.style.color = 'red';
        return;
    }

    try {
        const respuestaServidor = await fetch('/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, correo, password })
        });

        const data = await respuestaServidor.json();

        if (!respuestaServidor.ok) {
            mensaje.textContent = data.mensaje;
            mensaje.style.color = 'red';
            return;
        }

        mensaje.textContent = data.mensaje;
        mensaje.style.color = 'green';
        registroForm.reset();
    } catch (error) {
        mensaje.textContent = 'Error al conectar con el servidor';
        mensaje.style.color = 'red';
        console.error(error);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = loginCorreo.value.trim();
    const password = loginPassword.value.trim();

    if (!correo || !password) {
        mensaje.textContent = 'Completa correo y contraseña';
        mensaje.style.color = 'red';
        return;
    }

    try {
        const respuestaServidor = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo, password })
        });

        const data = await respuestaServidor.json();

        if (!respuestaServidor.ok) {
            mensaje.textContent = data.mensaje;
            mensaje.style.color = 'red';
            return;
        }

        mensaje.textContent = `Bienvenido, ${data.usuario.nombre}`;
        mensaje.style.color = 'green';

        localStorage.setItem('usuarioAgrosyph', JSON.stringify(data.usuario));

        loginForm.reset();

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        mensaje.textContent = 'Error al conectar con el servidor';
        mensaje.style.color = 'red';
        console.error(error);
    }
});