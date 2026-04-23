const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agrosyph'
});

conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión a MySQL:', error);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

module.exports = conexion;