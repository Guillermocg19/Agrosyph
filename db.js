const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'agrosyph'
});

conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión a MySQL:', error);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

module.exports = conexion;