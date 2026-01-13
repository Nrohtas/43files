const mysql = require('mysql2');
require('dotenv').config({ path: 'e:\\Dashboard\\43files\\server\\.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || '43files'
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database.');

    const query = "ALTER TABLE oppp ADD COLUMN service DOUBLE DEFAULT NULL AFTER sentdata";

    connection.query(query, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column service already exists.');
            } else {
                console.error('Error adding column:', err.message);
            }
        } else {
            console.log('Successfully added service column to oppp table.');
        }
        connection.end();
    });
});
