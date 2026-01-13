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

    const tableName = 'oppp';
    const query = `DESCRIBE ${tableName}`;

    connection.query(query, (err, results) => {
        if (err) {
            console.error(`Error describing table ${tableName}:`, err.message);
        } else {
            console.log(`Schema for table '${tableName}':`);
            console.table(results);
        }
        connection.end();
    });
});
